import os
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from openai import OpenAI
import time
import sys

# Get API key from environment variable or command line
api_key = os.getenv('OPENAI_API_KEY') or (sys.argv[1] if len(sys.argv) > 1 else None)

if not api_key:
    print("❌ Error: OpenAI API key not provided!")
    print("\nUsage:")
    print("  1. Set environment variable: export OPENAI_API_KEY='your-key'")
    print("  2. Or pass as argument: python Transcribe.py 'your-api-key'")
    print("\nGet your API key from: https://platform.openai.com/api-keys")
    sys.exit(1)

client = OpenAI(api_key=api_key)

def compress_audio_first(input_path, output_path="compressed_audio.m4a"):
    """Compress the entire audio file first for faster processing with medium quality"""
    print(f"🗜️  STEP 1: Compressing entire audio file for MAXIMUM SPEED...")
    
    # Get original file size
    original_size_mb = os.path.getsize(input_path) / (1024 * 1024)
    print(f"📁 Original file size: {original_size_mb:.1f} MB")
    
    cmd = [
        "ffmpeg", "-i", input_path,
        "-vn",  # No video
        "-map_metadata", "-1",  # Remove metadata  
        "-ac", "1",  # Mono audio (sufficient for speech)
        "-c:a", "aac",  # AAC codec (fast + good quality)
        "-b:a", "32k",  # Medium bitrate for good speech quality + speed
        "-profile:a", "aac_low",  # Low complexity profile for speed
        "-movflags", "+faststart",  # Optimize for streaming/fast access
        "-threads", "0",  # Use all available CPU cores for speed
        "-preset", "ultrafast",  # Fastest encoding preset
        "-compression_level", "1",  # Fastest compression
        "-y", output_path  # Overwrite output
    ]
    
    try:
        print("⚡ Compressing with MAXIMUM SPEED settings...")
        print("🎯 Using: AAC codec, 32kbps, multi-threaded, ultrafast preset, low complexity")
        start_time = time.time()
        
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        
        end_time = time.time()
        compression_time = end_time - start_time
        
        if os.path.exists(output_path):
            compressed_size_mb = os.path.getsize(output_path) / (1024 * 1024)
            compression_ratio = original_size_mb / compressed_size_mb
            
            print(f"✅ SPEED-OPTIMIZED compression completed in {compression_time/60:.1f} minutes!")
            print(f"📦 Compressed size: {compressed_size_mb:.1f} MB")
            print(f"🎯 Compression ratio: {compression_ratio:.1f}x smaller")
            print(f"💾 Space saved: {original_size_mb - compressed_size_mb:.1f} MB")
            print(f"🚀 Quality: Medium (optimized for speech + maximum speed)")
            
            return output_path
        else:
            print("❌ Compression failed - output file not created")
            return None
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Compression failed: {e}")
        print(f"Error output: {e.stderr}")
        return None

def chunk_audio_with_ffmpeg(input_path, chunk_duration_minutes=15):
    """Split audio into compressed chunks using ffmpeg for maximum speed"""
    print(f"🔪 STEP 2: Chunking compressed audio into {chunk_duration_minutes}-minute segments...")
    
    # Get total duration first
    cmd = ["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", input_path]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        total_duration = float(result.stdout.strip())
        chunk_duration_seconds = chunk_duration_minutes * 60
        num_chunks = int(total_duration / chunk_duration_seconds) + 1
        
        print(f"📊 Total duration: {total_duration/3600:.1f} hours")
        print(f"📦 Creating {num_chunks} large chunks (15-min each) for optimal API efficiency...")
        
        chunk_files = []
        
        # Create all chunks simultaneously using subprocess
        chunk_processes = []
        for i in range(num_chunks):
            start_time = i * chunk_duration_seconds
            chunk_file = f"chunk_{i:03d}.m4a"
            
            cmd = [
                "ffmpeg", "-i", input_path,
                "-ss", str(start_time),
                "-t", str(chunk_duration_seconds),
                "-vn", "-ac", "1", 
                "-c:a", "aac", "-b:a", "32k",  # Same medium quality, max speed settings
                "-profile:a", "aac_low",
                "-threads", "0", "-preset", "ultrafast",
                "-compression_level", "1",
                "-y", chunk_file
            ]
            
            # Start process but don't wait
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            chunk_processes.append((i, chunk_file, process))
        
        # Wait for all chunk creation processes to complete
        print("🚀 Creating all large chunks simultaneously...")
        for i, chunk_file, process in chunk_processes:
            process.wait()
            if os.path.exists(chunk_file) and os.path.getsize(chunk_file) > 0:
                chunk_files.append((i, chunk_file))
                chunk_size_mb = os.path.getsize(chunk_file) / (1024 * 1024)
                print(f"✓ Created 15-min chunk {i+1}/{num_chunks} ({chunk_size_mb:.1f}MB)")
            else:
                print(f"✗ Failed to create chunk {i+1}")
        
        print(f"🎉 All {len(chunk_files)} large chunks created and ready for parallel transcription!")
        return chunk_files
        
    except Exception as e:
        print(f"❌ Error during chunking: {e}")
        return []

def transcribe_file(file_path):
    """Transcribe a single audio file"""
    try:
        with open(file_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="gpt-4o-mini-transcribe",
                file=audio_file,
                response_format="text"
            )
        # When response_format="text", the API returns a string directly
        return transcription
    except Exception as e:
        print(f"❌ Error transcribing {file_path}: {e}")
        return f"[ERROR: Could not transcribe {file_path}]"

def transcribe_chunk_parallel(chunk_data):
    """Transcribe a single chunk for parallel processing"""
    chunk_index, chunk_file = chunk_data
    
    try:
        start_time = time.time()
        print(f"🔄 Starting transcription of chunk {chunk_index + 1}...")
        
        transcription_text = transcribe_file(chunk_file)
        
        end_time = time.time()
        duration = end_time - start_time
        print(f"✅ Completed chunk {chunk_index + 1} in {duration:.1f}s")
        
        return (chunk_index, transcription_text, chunk_file)
    except Exception as e:
        print(f"❌ Error processing chunk {chunk_index + 1}: {e}")
        return (chunk_index, f"[ERROR: Could not transcribe chunk {chunk_index + 1}]", chunk_file)

def process_all_chunks_parallel(chunks, max_workers=10):
    """Process ALL chunks in parallel simultaneously for maximum speed"""
    total_chunks = len(chunks)
    print(f"\n🚀 MAXIMUM SPEED MODE: Processing ALL {total_chunks} chunks in parallel!")
    print(f"⚡ Using {min(max_workers, total_chunks)} parallel workers")
    
    transcriptions = {}
    chunk_files_to_cleanup = []
    
    start_time = time.time()
    
    with ThreadPoolExecutor(max_workers=min(max_workers, total_chunks)) as executor:
        # Submit ALL chunks for processing simultaneously
        future_to_chunk = {executor.submit(transcribe_chunk_parallel, chunk): chunk[0] for chunk in chunks}
        
        # Collect results as they complete
        completed = 0
        
        for future in as_completed(future_to_chunk):
            chunk_index, text, chunk_file = future.result()
            transcriptions[chunk_index] = text
            chunk_files_to_cleanup.append(chunk_file)
            completed += 1
            
            elapsed = time.time() - start_time
            if completed > 0:
                eta = (elapsed / completed) * (total_chunks - completed)
                print(f"📊 Progress: {completed}/{total_chunks} ({completed/total_chunks*100:.1f}%) | ETA: {eta/60:.1f} min")
    
    # Combine transcriptions in order
    print("\n📝 Combining all transcriptions in correct order...")
    full_transcription = ""
    for i in range(total_chunks):
        if i in transcriptions:
            full_transcription += transcriptions[i] + "\n\n"
        else:
            full_transcription += f"[MISSING CHUNK {i+1}]\n\n"
    
    # Clean up chunk files
    print("🧹 Cleaning up temporary chunk files...")
    for chunk_file in chunk_files_to_cleanup:
        try:
            if os.path.exists(chunk_file):
                os.remove(chunk_file)
        except Exception as e:
            print(f"⚠️  Warning: Could not delete {chunk_file}: {e}")
    
    total_time = time.time() - start_time
    print(f"⚡ Parallel processing completed in {total_time/60:.1f} minutes")
    
    return full_transcription

def main():
    start_time = time.time()
    
    audio_file_path = "/Users/jordanmarshall/Downloads/RunningLean3rdEditionIteratefromPlanAtoaPlanThatWorks_ep7.mp3"
    
    # Check if file exists
    if not os.path.exists(audio_file_path):
        print(f"❌ Error: Audio file not found at {audio_file_path}")
        return
    
    # Get file size info
    file_size_mb = os.path.getsize(audio_file_path) / (1024 * 1024)
    print(f"📁 Processing audio file: {file_size_mb:.1f} MB")
    print("🎯 MAXIMUM SPEED STRATEGY: Compress first, then chunk + parallel processing")
    
    # STEP 1: Compress the entire file first
    compressed_file = compress_audio_first(audio_file_path)
    
    if not compressed_file:
        print("❌ Failed to compress audio. Exiting.")
        return
    
    # STEP 2: Chunk the compressed audio for maximum parallel processing
    chunks = chunk_audio_with_ffmpeg(compressed_file)
    
    if not chunks:
        print("❌ Failed to create chunks. Exiting.")
        return
    
    # STEP 3: Process ALL chunks in parallel simultaneously
    print(f"\n🚀 STEP 3: MAXIMUM SPEED TRANSCRIPTION")
    full_transcription = process_all_chunks_parallel(chunks, max_workers=10)
    
    # Save transcription
    output_filename = "transcription_output.txt"
    with open(output_filename, "w", encoding="utf-8") as txt_file:
        txt_file.write(full_transcription)
    
    # Clean up compressed file
    try:
        if os.path.exists(compressed_file):
            os.remove(compressed_file)
            print("🧹 Cleaned up compressed audio file")
    except Exception as e:
        print(f"⚠️  Warning: Could not delete compressed file: {e}")
    
    # Calculate timing
    end_time = time.time()
    processing_time = end_time - start_time
    
    print(f"\n🎊 TRANSCRIPTION COMPLETED!")
    print(f"📄 Saved to: {output_filename}")
    print(f"⏱️  Total processing time: {processing_time/60:.1f} minutes")
    print(f"🚀 Processing speed: {file_size_mb/(processing_time/60):.1f} MB/minute")
    print(f"⚡ Parallel efficiency: {len(chunks)} chunks processed simultaneously")

if __name__ == "__main__":
    main()