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

app = Flask(__name__, static_folder='frontend/build', static_url_path='')
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024 * 1024  # 2GB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['OUTPUT_FOLDER'] = 'outputs'

# Create directories
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

# Store transcription status and client instances
transcription_jobs = {}
client_instances = {}

# OPTIMIZATION SETTINGS
MAX_WORKERS = 20  # Increased from 10 for more parallelization
OPTIMAL_CHUNK_MINUTES = 5  # Smaller chunks for better parallelization
SKIP_COMPRESSION_THRESHOLD_MB = 25  # Skip compression for files under 25MB

def get_openai_client(api_key):
    """Get or create OpenAI client for the given API key"""
    if api_key not in client_instances:
        client_instances[api_key] = OpenAI(api_key=api_key)
    return client_instances[api_key]

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
        client = get_openai_client(api_key)
        
        with open(file_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="gpt-4o-transcribe",
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
        client = get_openai_client(api_key)
        
        with open(file_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="gpt-4o-transcribe",
                file=audio_file,
                response_format="text",
                language="en"  # Specify language for faster processing
            )
        return transcription
    except Exception as e:
        print(f"❌ Error transcribing {file_path}: {e}")
        return f"[ERROR: Could not transcribe {file_path} - {str(e)}]"

def process_transcription_optimized(job_id, audio_file_path, api_key):
    """Process transcription with optimal strategy based on file size"""
    try:
        start_time = time.time()
        
        # Validate API key early
        try:
            client = get_openai_client(api_key)
            # Test the API key with a simple request
            client.models.list()
        except Exception as e:
            transcription_jobs[job_id]['status'] = 'error'
            transcription_jobs[job_id]['message'] = f'Invalid API key: {str(e)}'
            return
        
        # Determine optimal strategy
        strategy, chunk_minutes, workers = get_optimal_strategy(audio_file_path)
        file_size_mb = os.path.getsize(audio_file_path) / (1024 * 1024)
        
        if strategy == "direct":
            # Small file: Direct transcription
            transcription_jobs[job_id]['status'] = 'transcribing'
            transcription_jobs[job_id]['progress'] = 50
            transcription_jobs[job_id]['message'] = f'Direct transcription ({file_size_mb:.1f}MB file)'
            
            full_transcription = transcribe_file_direct(audio_file_path, api_key)
            
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
                    future = executor.submit(transcribe_file, chunk_file, api_key)
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

@app.route('/upload', methods=['POST'])
def upload_file():
    # Check for API key
    api_key = request.form.get('api_key')
    if not api_key:
        return jsonify({'error': 'API key is required'}), 400
    
    if not api_key.startswith('sk-'):
        return jsonify({'error': 'Invalid API key format'}), 400
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file selected'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file:
        job_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"{job_id}_{filename}")
        file.save(filepath)
        
        # Initialize job status
        transcription_jobs[job_id] = {
            'status': 'uploaded',
            'progress': 0,
            'filename': filename
        }
        
        # Start optimized transcription in background with API key
        from threading import Thread
        thread = Thread(target=process_transcription_optimized, args=(job_id, filepath, api_key))
        thread.daemon = True
        thread.start()
        
        return jsonify({'job_id': job_id})

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