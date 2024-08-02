import os
import subprocess
from flask import Flask, jsonify, send_file, request
from download import generate_random_filename, download_image
from otel_config import init_otel
from opentelemetry import trace

IMAGE_MAX_WIDTH_PX=1000
IMAGE_MAX_HEIGHT_PX=1000

app = Flask(__name__)
init_otel(app)
tracer = trace.get_tracer(__name__)

# Route for health check
@app.route('/health')
def health():
    result = {"message": "I am here", "status_code": 0}
    return jsonify(result)

@app.route('/applyPhraseToPicture', methods=['POST', 'GET'])
def meminate():
    input = request.json or { "phrase": "I got you"}
    phrase = input.get("phrase", "words go here").upper()
    imageUrl = input.get("imageUrl", "http://missing.booo/no-url-here.png")

    # Get the absolute path to the PNG file
    input_image_path = download_image(imageUrl)

    # Check if the file exists
    if not os.path.exists(input_image_path):
        return 'downloaded image file not found', 500

    # Define the text to apply

    # Define the output image path
    output_image_path = generate_random_filename(input_image_path)

    command = ['convert',
            input_image_path,
            '-resize', f'{IMAGE_MAX_WIDTH_PX}x{IMAGE_MAX_HEIGHT_PX}>',
            '-gravity', 'North',
            '-pointsize', '48',
            '-fill', 'white',
            '-undercolor', '#00000080',
            '-font', 'Angkor-Regular',
            '-annotate', '0', phrase,
            output_image_path]

    # #  Execute ImageMagick command to apply text to the image
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception("Subprocess failed with return code:", result.returncode)

    # Serve the modified image
    return send_file(
        output_image_path,
        mimetype='image/png'
    )

@app.route("/generate-meme", methods=["POST"])
def generate_meme():
    user_id = request.json.get("userId")
    image_selected = request.json.get("imageSelected")
    phrase_selected = request.json.get("phraseSelected")
    
    with tracer.start_as_current_span("generate-meme") as span:
        span.set_attribute("userId", user_id)
        span.set_attribute("imageSelected", image_selected)
        span.set_attribute("phraseSelected", phrase_selected)

        return "Meme Generated", 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10117)
