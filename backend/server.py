# Filename - server.py
 
# Import flask and datetime module for showing date and time
from flask import Flask, request, jsonify
import datetime
import json
from flask_cors import CORS
import google.generativeai as genai
 
# Initializing flask app
app = Flask(__name__)
CORS(app)

system_instr = {
    "none": """Pretend you are talking to a person without any medical expertise. 
            You are easy to understand, simplify medical jargon, and can speak in layman's terms. 
            For any acronyms, please explain in parentheses next to it what they mean.""",
    "some": """Pretend you are talking to a person with some medical expertise, for example an undergraduate pre-med student. 
            You are concise in your answers, and explain acronyms that most pre-med students do not understand.""",
    "many": """Pretend you are talking to a medical expert who is very knowledgeable in their medical domain, for example a professor."""
}
purpose_instr = {
    "patient": "Also, you want to tailor your response to be helpful to a person seeking for help on their diagnosis.",
    "research": "Also, you want to tailor your response to be helpful to a researcher seeking more information on their diagnosis topic."
}
 
# Route for seeing a data
@app.route('/get_summary', methods=['POST'])
def get_summary():
    data = request.json
    json_data = data.get('json_data')
    diagnosis = data.get('diagnosis')
    understanding = data.get('understanding')
    purpose = data.get('purpose')
    key = data.get('key')
    genai.configure(api_key=key)

    model = genai.GenerativeModel(
        "models/gemini-1.5-pro-latest",
        system_instruction = system_instr[understanding] + purpose_instr[purpose],
        safety_settings = {
            'HATE': 'BLOCK_NONE',
            'HARASSMENT': 'BLOCK_NONE',
            'SEXUAL' : 'BLOCK_NONE',
            'DANGEROUS' : 'BLOCK_NONE'
        }
    )
    prompt = """Summarize this JSON file
    of a clinical trial in less than 100 words with a Title, Date, Experiment, Results, 
    and Limitations section for any helpful information on the study of {}. 
    Specifically, what was studied, how was the study conducted and who was involved 
    (including scores and measurements), what were the main findings and side effects, 
    and what are the next steps. Summarize this all in JSON format, where the sections
    are the keys and the content of each section are the values. Do not include backticks in the response. Data to summarize: """.format(diagnosis)
    response = model.generate_content(prompt + json.dumps(json_data))
    return jsonify({"response": response.text})
 
     
# Running app
if __name__ == '__main__':
    app.run(debug=True, port=5000)