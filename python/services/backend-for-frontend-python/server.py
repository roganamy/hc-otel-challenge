from flask import Flask, jsonify, Response, request
from o11yday_lib import fetch_from_service
from opentelemetry import trace
from otel_config import init_otel

app = Flask(__name__)
init_otel(app)
tracer = trace.get_tracer(__name__)

# Route for health check
@app.route('/health')
@app.route('/')
def health():
    return jsonify({"message": "I am here", "status_code": 0})

@app.route('/createPicture', methods=['POST'])
def create_picture():
        # Fetch data from phrase-picker and image-picker services asynchronously
        phrase_response = fetch_from_service('phrase-picker')
        image_response = fetch_from_service('image-picker')

        phrase_result = phrase_response.json() if phrase_response and phrase_response.ok else {"phrase": "This is sparta"}
        image_result = image_response.json() if phrase_response and image_response.ok else {"imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-Single.jpg/1360px-Banana-Single.jpg"}

        # Make a request to the meminator service
        body = {**phrase_result, **image_result}
        meminator_response = fetch_from_service('meminator', method="POST", body=body)

        # Check if the response was successful
        if not meminator_response.ok or meminator_response.content is None:
            raise Exception(f"Failed to fetch picture from meminator: {meminator_response.status_code} {meminator_response.reason}")

        # Return the picture data
        flask_response = Response(meminator_response.content, status=meminator_response.status_code, content_type=meminator_response.headers.get('content-type'))

        return flask_response

@app.route("/process", methods=["POST"])
def process():
    user_id = request.json.get("userId")
    product_id = request.json.get("productId")
    image_selected = request.json.get("imageSelected")
    number_of_items = request.json.get("numberOfItems")
    
    with tracer.start_as_current_span("process") as span:
        span.set_attribute("userId", user_id)
        span.set_attribute("productId", product_id)
        span.set_attribute("imageSelected", image_selected)
        span.set_attribute("numberOfItems", number_of_items)

        return "Processed", 200

@app.route('/rate-meme', methods=['POST'])
def rate_meme():
    data = request.json
    user_id = data.get('userId')
    meme_id = data.get('memeId')
    rating = data.get('rating')
    used = data.get('used')

    with tracer.start_as_current_span("rate-meme") as span:
        span.set_attribute("userId", user_id)
        span.set_attribute("memeId", meme_id)
        span.set_attribute("rating", rating)
        span.set_attribute("used", used)

    return jsonify({"message": "Rating submitted successfully"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10115)
