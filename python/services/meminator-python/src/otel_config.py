# otel_config.py

from opentelemetry import trace
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

# Set up the tracer provider
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

# Set up the span exporter to send data to Honeycomb
span_exporter = OTLPSpanExporter(endpoint="https://api.honeycomb.io", headers=(("x-honeycomb-team", "tqEvnfLzd2V0fjrjTniymD"),))
span_processor = BatchSpanProcessor(span_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)

# Instrument Flask and Requests
def init_otel(app):
    FlaskInstrumentor().instrument_app(app)
    RequestsInstrumentor().instrument()
