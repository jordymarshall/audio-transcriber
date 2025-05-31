from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import os
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from openai import OpenAI
import time
import uuid
from werkzeug.utils import secure_filename
import stripe
import json
import hashlib
from datetime import datetime, timedelta
import jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

app = Flask(__name__, static_folder='frontend/build', static_url_path='')
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['OUTPUT_FOLDER'] = 'outputs'
app.config['USERS_FILE'] = 'users.json'

# OpenAI configuration - Use developer's API key
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    print("⚠️  WARNING: OpenAI API key not found in environment variables!")
    print("Please add OPENAI_API_KEY to your .env file")

# Google OAuth configuration
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
if not GOOGLE_CLIENT_ID:
    print("⚠️  WARNING: Google Client ID not found in environment variables!")
    print("Please add GOOGLE_CLIENT_ID to your .env file")

# Stripe configuration
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
STRIPE_PUBLISHABLE_KEY = os.getenv('STRIPE_PUBLISHABLE_KEY')

# Validate Stripe keys are set
if not stripe.api_key or not STRIPE_PUBLISHABLE_KEY:
    print("⚠️  WARNING: Stripe keys not found in environment variables!")
    print("Please create a .env file with STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY")
    print("See STRIPE_SETUP.md for instructions")

# Pricing configuration
MONTHLY_PRICE = 1.99  # $1.99 per month
STRIPE_PRICE_ID = 'price_1234567890'  # Will be created in Stripe dashboard

# Create directories
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

# Store transcription status
transcription_jobs = {}

# Initialize OpenAI client with developer's API key
if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
else:
    openai_client = None

# User management functions
def load_users():
    """Load user data from file"""
    try:
        if os.path.exists(app.config['USERS_FILE']):
            with open(app.config['USERS_FILE'], 'r') as f:
                return json.load(f)
    except:
        pass
    return {}

def save_users(users_data):
    """Save user data to file"""
    try:
        with open(app.config['USERS_FILE'], 'w') as f:
            json.dump(users_data, f, indent=2)
    except Exception as e:
        print(f"Error saving user data: {e}")

def verify_google_token(token):
    """Verify Google ID token and return user info"""
    try:
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
        
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')
            
        return {
            'google_id': idinfo['sub'],
            'email': idinfo['email'],
            'name': idinfo['name'],
            'picture': idinfo.get('picture', ''),
            'verified_email': idinfo.get('email_verified', False)
        }
    except ValueError as e:
        print(f"Invalid Google token: {e}")
        return None

def get_or_create_user(google_user_info):
    """Get existing user or create new user from Google info"""
    users = load_users()
    google_id = google_user_info['google_id']
    
    if google_id in users:
        # Update user info
        users[google_id].update({
            'name': google_user_info['name'],
            'email': google_user_info['email'],
            'picture': google_user_info['picture'],
            'last_login': datetime.now().isoformat()
        })
    else:
        # Create new user with free first transcription
        users[google_id] = {
            'google_id': google_id,
            'name': google_user_info['name'],
            'email': google_user_info['email'],
            'picture': google_user_info['picture'],
            'transcription_count': 0,
            'subscription_active': False,
            'subscription_end': None,
            'subscription_id': None,
            'created_at': datetime.now().isoformat(),
            'last_login': datetime.now().isoformat(),
            'has_used_free_transcription': False
        }
    
    save_users(users)
    return users[google_id]

def check_user_subscription(user_id):
    """Check if user has an active subscription or free transcription available"""
    users = load_users()
    user = users.get(user_id, {})
    
    # Check if user has active subscription
    subscription_end = user.get('subscription_end')
    if subscription_end:
        subscription_end_date = datetime.fromisoformat(subscription_end)
        if datetime.now() < subscription_end_date:
            return True, subscription_end_date, 'subscription'
    
    # Check if user can use free first transcription
    if not user.get('has_used_free_transcription', False):
        return True, None, 'free'
    
    return False, None, None

def activate_user_subscription(user_id, subscription_id):
    """Activate a monthly subscription for user"""
    users = load_users()
    if user_id not in users:
        return None
    
    # Set subscription to end in 30 days
    subscription_end = datetime.now() + timedelta(days=30)
    users[user_id]['subscription_id'] = subscription_id
    users[user_id]['subscription_active'] = True
    users[user_id]['subscription_start'] = datetime.now().isoformat()
    users[user_id]['subscription_end'] = subscription_end.isoformat()
    users[user_id]['last_payment'] = datetime.now().isoformat()
    
    save_users(users)
    return subscription_end

def increment_user_transcription_count(user_id, is_free=False):
    """Increment user's transcription count"""
    users = load_users()
    if user_id not in users:
        return 0
    
    users[user_id]['transcription_count'] = users[user_id].get('transcription_count', 0) + 1
    users[user_id]['last_transcription'] = datetime.now().isoformat()
    
    if is_free:
        users[user_id]['has_used_free_transcription'] = True
    
    save_users(users)
    return users[user_id]['transcription_count']

# OPTIMIZATION SETTINGS
MAX_WORKERS = 20  # Increased from 10 for more parallelization
OPTIMAL_CHUNK_MINUTES = 5  # Smaller chunks for better parallelization
SKIP_COMPRESSION_THRESHOLD_MB = 25  # Skip compression for files under 25MB

def get_user_identifier(request):
    """Generate a unique identifier for the user based on IP and User-Agent"""
    user_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', ''))
    user_agent = request.environ.get('HTTP_USER_AGENT', '')
    identifier = f"{user_ip}:{user_agent}"
    return hashlib.sha256(identifier.encode()).hexdigest()

def load_usage_data():
    """Load usage tracking data from file"""
    try:
        if os.path.exists(app.config['USAGE_FILE']):
            with open(app.config['USAGE_FILE'], 'r') as f:
                return json.load(f)
    except:
        pass
    return {}

def save_usage_data(data):
    """Save usage tracking data to file"""
    try:
        with open(app.config['USAGE_FILE'], 'w') as f:
            json.dump(data, f)
    except Exception as e:
        print(f"Error saving usage data: {e}")

def increment_user_usage(user_id):
    """Increment user's usage count (for analytics)"""
    usage_data = load_usage_data()
    if user_id not in usage_data:
        usage_data[user_id] = {'usage_count': 0, 'first_use': datetime.now().isoformat()}
    
    usage_data[user_id]['usage_count'] = usage_data[user_id].get('usage_count', 0) + 1
    usage_data[user_id]['last_use'] = datetime.now().isoformat()
    save_usage_data(usage_data)
    return usage_data[user_id]['usage_count']

def get_optimal_strategy(file_path):
    """Determine the optimal processing strategy based on file size"""
    file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
    
    if file_size_mb <= SKIP_COMPRESSION_THRESHOLD_MB:
        # Small file: Direct transcription without compression or chunking
        return "direct", None, None
    elif file_size_mb <= 100:
        # Medium file: Compress and chunk with 10-minute chunks
        return "compress_chunk", 10, 15
    else:
        # Large file: Aggressive compression and 5-minute chunks
        return "compress_chunk", 5, MAX_WORKERS

def compress_audio_fast(input_path, output_path, aggressive=False):
    """Compress audio with speed optimizations"""
    print(f"🗜️  Compressing audio for maximum speed...")
    
    original_size_mb = os.path.getsize(input_path) / (1024 * 1024)
    print(f"📁 Original file size: {original_size_mb:.1f} MB")
    
    # Use more aggressive settings for larger files
    bitrate = "24k" if aggressive else "32k"
    
    cmd = [
        get_ffmpeg_path(), "-i", input_path,
        "-vn", "-map_metadata", "-1", "-ac", "1",
        "-c:a", "aac", "-b:a", bitrate, "-profile:a", "aac_low",
        "-movflags", "+faststart", "-threads", "0", "-preset", "ultrafast",
        "-compression_level", "1", "-filter:a", "atempo=1.0",  # Maintain tempo
        "-y", output_path
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        
        if os.path.exists(output_path):
            compressed_size_mb = os.path.getsize(output_path) / (1024 * 1024)
            print(f"✅ Compressed to {compressed_size_mb:.1f} MB ({original_size_mb/compressed_size_mb:.1f}x smaller)")
            return output_path
        return None
    except Exception as e:
        print(f"❌ Compression failed: {e}")
        return None

def transcribe_file_direct(file_path, api_key):
    """Directly transcribe a file without chunking (for small files)"""
    try:
        print(f"⚡ Direct transcription (file under {SKIP_COMPRESSION_THRESHOLD_MB}MB)")
        
        # Use global client instead of per-API-key client
        if not openai_client:
            print("❌ OpenAI client not initialized")
            return "[ERROR: OpenAI client not initialized]"
        
        with open(file_path, "rb") as audio_file:
            transcription = openai_client.audio.transcriptions.create(
                model="gpt-4o-mini-transcribe",
                file=audio_file,
                response_format="text"
            )
        return transcription
    except Exception as e:
        print(f"❌ Error transcribing: {e}")
        return f"[ERROR: Could not transcribe file - {str(e)}]"

def chunk_audio_parallel(input_path, chunk_duration_minutes):
    """Split audio into chunks with parallel processing"""
    cmd = [get_ffprobe_path(), "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", input_path]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        total_duration = float(result.stdout.strip())
        chunk_duration_seconds = chunk_duration_minutes * 60
        num_chunks = int(total_duration / chunk_duration_seconds) + 1
        
        print(f"📊 Creating {num_chunks} chunks ({chunk_duration_minutes} min each)")
        
        chunk_files = []
        
        # Use ThreadPoolExecutor for parallel chunk creation
        with ThreadPoolExecutor(max_workers=min(num_chunks, 10)) as executor:
            futures = []
            
            for i in range(num_chunks):
                start_time = i * chunk_duration_seconds
                chunk_file = f"temp_chunk_{uuid.uuid4().hex[:8]}_{i:03d}.m4a"
                
                cmd = [
                    get_ffmpeg_path(), "-i", input_path, "-ss", str(start_time),
                    "-t", str(chunk_duration_seconds), "-vn", "-ac", "1", 
                    "-c:a", "aac", "-b:a", "24k", "-profile:a", "aac_low",
                    "-threads", "0", "-preset", "ultrafast",
                    "-y", chunk_file
                ]
                
                future = executor.submit(subprocess.run, cmd, capture_output=True, text=True)
                futures.append((i, chunk_file, future))
            
            # Collect results
            for i, chunk_file, future in futures:
                try:
                    future.result()  # Wait for completion
                    if os.path.exists(chunk_file) and os.path.getsize(chunk_file) > 0:
                        chunk_files.append((i, chunk_file))
                except:
                    print(f"✗ Failed to create chunk {i+1}")
        
        print(f"✅ Created {len(chunk_files)} chunks successfully")
        return chunk_files
        
    except Exception as e:
        print(f"❌ Error during chunking: {e}")
        return []

def transcribe_file(file_path, api_key):
    """Transcribe a single audio file"""
    try:
        # Use global client instead of per-API-key client
        if not openai_client:
            print("❌ OpenAI client not initialized")
            return "[ERROR: OpenAI client not initialized]"
        
        with open(file_path, "rb") as audio_file:
            transcription = openai_client.audio.transcriptions.create(
                model="gpt-4o-mini-transcribe",
                file=audio_file,
                response_format="text",
                language="en"  # Specify language for faster processing
            )
        return transcription
    except Exception as e:
        print(f"❌ Error transcribing {file_path}: {e}")
        return f"[ERROR: Could not transcribe {file_path} - {str(e)}]"

def process_transcription_optimized(job_id, audio_file_path):
    """Process transcription with optimal strategy based on file size"""
    try:
        start_time = time.time()
        
        # Check if OpenAI client is initialized
        if not openai_client:
            transcription_jobs[job_id]['status'] = 'error'
            transcription_jobs[job_id]['message'] = 'OpenAI API key not configured'
            return
        
        # Determine optimal strategy
        strategy, chunk_minutes, workers = get_optimal_strategy(audio_file_path)
        file_size_mb = os.path.getsize(audio_file_path) / (1024 * 1024)
        
        if strategy == "direct":
            # Small file: Direct transcription
            transcription_jobs[job_id]['status'] = 'transcribing'
            transcription_jobs[job_id]['progress'] = 50
            transcription_jobs[job_id]['message'] = f'Direct transcription ({file_size_mb:.1f}MB file)'
            
            full_transcription = transcribe_file_direct(audio_file_path, None)
            
        else:
            # Larger files: Compress and chunk
            transcription_jobs[job_id]['status'] = 'compressing'
            transcription_jobs[job_id]['progress'] = 10
            
            # Compress
            compressed_file = compress_audio_fast(
                audio_file_path, 
                f"temp_compressed_{job_id}.m4a",
                aggressive=(file_size_mb > 100)
            )
            
            if not compressed_file:
                transcription_jobs[job_id]['status'] = 'error'
                transcription_jobs[job_id]['message'] = 'Compression failed'
                return
            
            transcription_jobs[job_id]['status'] = 'chunking'
            transcription_jobs[job_id]['progress'] = 20
            
            # Chunk with optimal duration
            chunks = chunk_audio_parallel(compressed_file, chunk_minutes)
            
            if not chunks:
                transcription_jobs[job_id]['status'] = 'error'
                transcription_jobs[job_id]['message'] = 'Chunking failed'
                return
            
            transcription_jobs[job_id]['status'] = 'transcribing'
            transcription_jobs[job_id]['progress'] = 30
            transcription_jobs[job_id]['total_chunks'] = len(chunks)
            
            # Transcribe with maximum parallelization
            transcriptions = {}
            chunk_files_to_cleanup = []
            
            with ThreadPoolExecutor(max_workers=workers) as executor:
                futures = {}
                
                # Submit all chunks at once
                for chunk_index, chunk_file in chunks:
                    future = executor.submit(transcribe_file, chunk_file, None)
                    futures[future] = (chunk_index, chunk_file)
                
                completed = 0
                for future in as_completed(futures):
                    chunk_index, chunk_file = futures[future]
                    chunk_files_to_cleanup.append(chunk_file)
                    
                    try:
                        transcriptions[chunk_index] = future.result()
                        completed += 1
                        
                        progress = 30 + (completed / len(chunks)) * 60
                        transcription_jobs[job_id]['progress'] = int(progress)
                        transcription_jobs[job_id]['completed_chunks'] = completed
                        
                        # Log progress
                        elapsed = time.time() - start_time
                        rate = completed / (elapsed / 60) if elapsed > 0 else 0
                        print(f"✓ Chunk {completed}/{len(chunks)} | {rate:.1f} chunks/min")
                        
                    except Exception as e:
                        transcriptions[chunk_index] = f"[ERROR in chunk {chunk_index+1}]"
                        print(f"✗ Error in chunk {chunk_index+1}: {e}")
            
            # Combine transcriptions
            full_transcription = ""
            for i in range(len(chunks)):
                if i in transcriptions:
                    full_transcription += transcriptions[i] + "\n\n"
            
            # Cleanup
            try:
                os.remove(compressed_file)
                for chunk_file in chunk_files_to_cleanup:
                    if os.path.exists(chunk_file):
                        os.remove(chunk_file)
            except:
                pass
        
        # Save result
        output_file = os.path.join(app.config['OUTPUT_FOLDER'], f"transcription_{job_id}.txt")
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(full_transcription)
        
        # Clean up original
        try:
            os.remove(audio_file_path)
        except:
            pass
        
        # Calculate final stats
        total_time = time.time() - start_time
        transcription_jobs[job_id]['status'] = 'completed'
        transcription_jobs[job_id]['progress'] = 100
        transcription_jobs[job_id]['output_file'] = output_file
        transcription_jobs[job_id]['processing_time'] = f"{total_time/60:.1f} minutes"
        transcription_jobs[job_id]['processing_speed'] = f"{file_size_mb/(total_time/60):.1f} MB/min"
        
        print(f"🎉 Completed in {total_time/60:.1f} minutes ({file_size_mb/(total_time/60):.1f} MB/min)")
        
    except Exception as e:
        transcription_jobs[job_id]['status'] = 'error'
        transcription_jobs[job_id]['message'] = str(e)
        print(f"❌ Fatal error: {e}")

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/')
def api_info():
    return jsonify({
        'status': 'running',
        'message': 'Audio Transcription API - Secure Version',
        'endpoints': {
            'POST /upload': 'Upload audio file with API key',
            'GET /status/<job_id>': 'Check transcription status',
            'GET /download/<job_id>': 'Download transcription'
        },
        'note': 'API key must be provided with each upload request'
    })

@app.route('/api/config')
def get_stripe_config():
    """Get Stripe publishable key and Google client ID for frontend"""
    return jsonify({
        'publishable_key': STRIPE_PUBLISHABLE_KEY,
        'google_client_id': GOOGLE_CLIENT_ID
    })

@app.route('/api/create-payment-intent', methods=['POST'])
def create_payment_intent():
    """Create a Stripe payment intent for monthly subscription ($1.99)"""
    try:
        # Create a one-time payment that represents monthly subscription
        intent = stripe.PaymentIntent.create(
            amount=199,  # $1.99 in cents
            currency='usd',
            metadata={
                'service': 'audio_transcription_monthly',
                'user_id': get_user_identifier(request),
                'subscription_type': 'monthly'
            }
        )
        
        return jsonify({
            'client_secret': intent.client_secret
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/check-usage', methods=['GET'])
def check_usage():
    """Check if user has active subscription"""
    user_id = get_user_identifier(request)
    subscription_active, subscription_end, subscription_type = check_user_subscription(user_id)
    
    return jsonify({
        'subscription_active': subscription_active,
        'subscription_end': subscription_end.isoformat() if subscription_end else None,
        'subscription_type': subscription_type,
        'needs_payment': not subscription_active,
        'price': MONTHLY_PRICE,
        'billing_type': 'monthly'
    })

@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    """Handle Google OAuth authentication"""
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({'error': 'No token provided'}), 400
        
        # Verify Google token
        google_user_info = verify_google_token(token)
        if not google_user_info:
            return jsonify({'error': 'Invalid Google token'}), 401
        
        # Get or create user
        user = get_or_create_user(google_user_info)
        
        # Check subscription status
        subscription_active, subscription_end, subscription_type = check_user_subscription(user['google_id'])
        
        return jsonify({
            'success': True,
            'user': {
                'id': user['google_id'],
                'name': user['name'],
                'email': user['email'],
                'picture': user['picture'],
                'transcription_count': user['transcription_count'],
                'subscription_active': subscription_active,
                'subscription_end': subscription_end.isoformat() if subscription_end else None,
                'subscription_type': subscription_type,
                'has_used_free_transcription': user.get('has_used_free_transcription', False)
            }
        })
        
    except Exception as e:
        print(f"Authentication error: {e}")
        return jsonify({'error': 'Authentication failed'}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Handle user logout"""
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/user/status', methods=['GET'])
def get_user_status():
    """Get current user status (requires authentication)"""
    try:
        # Get user ID from request headers (you'll need to implement proper token validation)
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No authorization header'}), 401
            
        # For now, we'll use a simple approach - in production, use proper JWT tokens
        user_id = request.headers.get('X-User-ID')
        if not user_id:
            return jsonify({'error': 'User ID not provided'}), 401
        
        users = load_users()
        user = users.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        subscription_active, subscription_end, subscription_type = check_user_subscription(user_id)
        
        return jsonify({
            'user': {
                'id': user['google_id'],
                'name': user['name'],
                'email': user['email'],
                'picture': user['picture'],
                'transcription_count': user['transcription_count'],
                'subscription_active': subscription_active,
                'subscription_end': subscription_end.isoformat() if subscription_end else None,
                'subscription_type': subscription_type,
                'has_used_free_transcription': user.get('has_used_free_transcription', False)
            }
        })
        
    except Exception as e:
        print(f"Error getting user status: {e}")
        return jsonify({'error': 'Failed to get user status'}), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    # Check if OpenAI is configured
    if not openai_client:
        return jsonify({'error': 'Service temporarily unavailable - OpenAI not configured'}), 503
    
    # Get authenticated user
    user_id = request.headers.get('X-User-ID')
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    users = load_users()
    user = users.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check user subscription or free transcription availability
    subscription_active, subscription_end, subscription_type = check_user_subscription(user_id)
    
    # If not subscribed and no free transcription available, check for payment
    if not subscription_active:
        payment_intent_id = request.form.get('payment_intent_id')
        if not payment_intent_id:
            return jsonify({
                'error': 'Monthly subscription required ($1.99/month for unlimited transcriptions)',
                'user_status': {
                    'has_used_free_transcription': user.get('has_used_free_transcription', False),
                    'transcription_count': user.get('transcription_count', 0)
                }
            }), 402
        
        # Verify payment was successful and activate subscription
        try:
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            if payment_intent.status != 'succeeded':
                return jsonify({'error': 'Payment not completed'}), 402
            
            # Activate subscription for 30 days
            subscription_end = activate_user_subscription(user_id, payment_intent_id)
            subscription_active = True
            subscription_type = 'subscription'
            
        except Exception as e:
            return jsonify({'error': 'Invalid payment'}), 402
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file selected'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file:
        # Increment transcription count
        is_free_transcription = (subscription_type == 'free')
        transcription_count = increment_user_transcription_count(user_id, is_free_transcription)
        
        job_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"{job_id}_{filename}")
        file.save(filepath)
        
        # Initialize job status
        transcription_jobs[job_id] = {
            'status': 'uploaded',
            'progress': 0,
            'filename': filename,
            'user_id': user_id,
            'transcription_count': transcription_count,
            'subscription_active': subscription_active,
            'subscription_type': subscription_type,
            'is_free_transcription': is_free_transcription
        }
        
        # Start optimized transcription in background
        from threading import Thread
        thread = Thread(target=process_transcription_optimized, args=(job_id, filepath))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'job_id': job_id,
            'user': {
                'transcription_count': transcription_count,
                'subscription_active': subscription_active,
                'subscription_end': subscription_end.isoformat() if subscription_end else None,
                'subscription_type': subscription_type,
                'has_used_free_transcription': user.get('has_used_free_transcription', False) or is_free_transcription
            }
        })

@app.route('/status/<job_id>')
def get_status(job_id):
    if job_id not in transcription_jobs:
        return jsonify({'error': 'Job not found'}), 404
    return jsonify(transcription_jobs[job_id])

@app.route('/download/<job_id>')
def download_file(job_id):
    if job_id not in transcription_jobs:
        return jsonify({'error': 'Job not found'}), 404
    
    job = transcription_jobs[job_id]
    if job['status'] != 'completed':
        return jsonify({'error': 'Transcription not completed'}), 400
    
    return send_file(job['output_file'], as_attachment=True, download_name=f"transcription_{job['filename']}.txt")

@app.route('/<path:path>')
def serve_react(path):
    return send_from_directory(app.static_folder, path)

def get_ffmpeg_path():
    """Get the correct ffmpeg path for the environment"""
    # Try Homebrew path first (local development)
    if os.path.exists("/opt/homebrew/bin/ffmpeg"):
        return "/opt/homebrew/bin/ffmpeg"
    # Try system path (deployment)
    return "ffmpeg"

def get_ffprobe_path():
    """Get the correct ffprobe path for the environment"""
    # Try Homebrew path first (local development)
    if os.path.exists("/opt/homebrew/bin/ffprobe"):
        return "/opt/homebrew/bin/ffprobe"
    # Try system path (deployment)
    return "ffprobe"

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8001))  # Use PORT from environment for deployment
    app.run(debug=False, host='0.0.0.0', port=port)  # Set debug=False for production 