import { useState, useEffect } from 'react';
import './App.css';
import { word_depth, system_instr, purpose_instr, safety_settings } from './constants';
import TrialSummary from './TrialSummary';

const { GoogleGenerativeAI } = require("@google/generative-ai");

const api_keys = [process.env.REACT_APP_GEMINI_API_KEY, process.env.REACT_APP_GEMINI_API_KEY1, process.env.REACT_APP_GEMINI_API_KEY2]

const parseUserDiagnosisInput = (input_str) => {
  const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
  async function run() {
    const model = genAI.getGenerativeModel({ model: "gemini-pro", safetySettings: safety_settings});
    const prompt = `Find the specific condition/disease this text is referring to. Correct any spelling mistakes. 
                    If a specific condition/disease can't be found, then output: Condition/disease Not Found. 
                    This is the input text you need to parse: `;
    const result = await model.generateContent(prompt + input_str);
    const response = await result.response;
    const text = response.text();
    return text;
  }
  const diagnosis = run();
  return diagnosis;
}

// Function to get clinical trials
const getClinicalTrials = (queryTerm, pageSize) => {
  const url = "https://clinicaltrials.gov/api/v2/studies";
  const headers = {
    "Accept": "application/json"
  };
  
  const queryParams = {
    "query.term": queryTerm,
    "aggFilters": "results:with,status:com",
    "sort": ["@relevance"],
    "pageSize": pageSize,
    "fields": "NCTId,BriefTitle,LastUpdatePostDate"
  };

  return fetch(`${url}?${new URLSearchParams(queryParams).toString()}`, {
    headers
  })
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
  })
  .catch(error => {
    console.error("Error fetching clinical trials:", error.message);
    return null;
  });
}

// Function to get a single study
const getSingleStudy = (nctId, format = "json", markupFormat = "markdown", fields = null) => {
  const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;
  const headers = {
    "Accept": "application/json"
  };
  const params = {
    "format": format,
    "markupFormat": markupFormat
  };

  if (fields) {
    params.fields = fields.join(",");
  }

  return fetch(`${url}?${new URLSearchParams(params).toString()}`, {
    headers
  })
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
  })
  .catch(error => {
    console.error("Error fetching study:", error.message);
    return null;
  });
}

const getCombinedSummary = async (json_data, diagnosis, depth, understanding, purpose) => {
  const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

  async function run() {
    const model = genAI.getGenerativeModel({ model: "gemini-pro", safetySettings: safety_settings});
    const prompt = `${system_instr[understanding] + purpose_instr[purpose]} Given a list of 10 different clinical studies on ${diagnosis}, give a summary in ${word_depth[depth][0]} to ${word_depth[depth][1]} words without headings or
                    subheadings of what the findings are across all 10 studies. Specifically, what was studied, how was the study conducted and who was involved,
                    what were the main findings and side effects, and what are the next steps. Include how the research on this diagnosis has evolved over time based
                    on the 10 studies.`;
    const result = await model.generateContent(prompt + JSON.stringify(json_data));
    const response = await result.response;
    const text = response.text();
    return text;
  }
  try {
    const summary = run();
    return summary;
  } 
  catch (error) {
    console.error('Error in getCombinedSummary():', error.message);
    return;
  }
}

const getOneTrialSummary = async (json_data, diagnosis, understanding, purpose, key) => {  
    try {
        const response = await fetch('http://localhost:5000/get_summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            mode: 'cors',
            body: JSON.stringify({
                json_data, diagnosis, understanding, purpose, key
            })
        })
        const jsonData = await response.json();
        console.log("RESULTING JSON DATA: ", jsonData);
        return jsonData.response;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function App() {
  const [conditionInput, setConditionInput] = useState("");
  const [personType, setPersonType] = useState("");
  const [knowledgeType, setKnowledgeType] = useState("");
  const [depthType, setDepthType] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [summary, setSummary] = useState("");
  const [trialSummary, setTrialSummary] = useState([]);

  const handleConditionInputChange = (event) => {
    setConditionInput(event.target.value);
  };

  const handlePersonTypeSelectChange = (event) => {
    setPersonType(event.target.value);
  };

  const handleKnowledgeTypeSelectChange = (event) => {
    setKnowledgeType(event.target.value);
  };

  const handleDepthTypeSelectChange = (event) => {
    setDepthType(event.target.value);
  }
  
  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    let condition = "";

    parseUserDiagnosisInput(conditionInput)
    .then((user_condition) => {
      console.log("Parsed User Condition: ", user_condition);
      condition = user_condition;
      return getClinicalTrials(user_condition, 2 || process.env.REACT_APP_NUM_CLINICAL_TRIALS);
    })
    .then((response) => {
      console.log("NCT IDs: ", response);
      const promises = response.studies.map((study) => 
        getSingleStudy(study.protocolSection.identificationModule.nctId));
      return Promise.all(promises);
    })
    .then(async (response) => {
        // Get individial summaries
        const trialSummaries = await Promise.all(response.map((trial_data, i) => {
            return getOneTrialSummary(trial_data, condition, knowledgeType, personType, api_keys[i % 4]);
        }));
        const parsedSummaries = trialSummaries.map((unparsed) => {
            const cleanedJsonString = unparsed.trim().replace(/^```json|```$/g, '');
            const jsonObject = JSON.parse(cleanedJsonString);
            return jsonObject;
        });
        setTrialSummary(parsedSummaries);
        // Get overall summary
        // const overall_summary = getCombinedSummary(response, condition, depthType, knowledgeType, personType)
        // setSummary(overall_summary);
        setLoading(false);
    })
    .catch((error) => {
      console.error("Error: ", error.message);
    });
  };

  useEffect(() => {
    console.log("Trial Summaries: ", trialSummary);
    console.log("Overall Summary: ", summary);
  }, [trialSummary, summary]);
  
  return (
    <div className="parent-container">
        <div className="container">
            <form className="form-container" onSubmit={handleSubmit}>
                <h3>Summarizer Options</h3>
                <label htmlFor="condition">What is your medical condition?</label>
                <br></br>
                <input
                    type="text" 
                    id="condition" 
                    name="condition" 
                    placeholder="Enter the medical condition name" 
                    value={conditionInput}
                    onChange={handleConditionInputChange}
                    required 
                />
                <br></br>
                <label htmlFor="personType">What are you seeking?</label>
                <br></br>
                <select 
                    id="personType" 
                    name="personType" 
                    value={personType}
                    onChange={handlePersonTypeSelectChange}
                    required
                >
                <option value="">Select an option</option>
                <option value="patient">I am seeking help on my condition (Patient)</option>
                <option value="researcher">I am seeking additional information for my studies (Researcher)</option>
                </select>
                <br></br>
                <label htmlFor="knowledgeType">How much medical knowledge do you have?</label>
                <br></br>
                <select
                    id="knowledgeType" 
                    name="knowledgeType" 
                    value={knowledgeType}
                    onChange={handleKnowledgeTypeSelectChange}
                    required
                >
                <option value="">Select an option</option>
                <option value="none">I have none or minimal medical knowledge.</option>
                <option value="some">I have some medical knowledge.</option>
                <option value="many">I have comprehensive medical knowledge.</option>
                </select>
                <br></br>
                <label htmlFor="depthType">How much information do you want?</label>
                <br></br>
                <select
                    id="depthType"
                    name="depthType"
                    value={depthType}
                    onChange={handleDepthTypeSelectChange}
                    required
                >
                <option value="">Select an option</option>
                <option value="low">Minimal</option>
                <option value="medium">Some</option>
                <option value="high">A Lot</option>
                </select>
                <br></br>
                <button type="submit" onSubmit={(e) => handleSubmit(e)}>{loading ? "Loading..." : "Submit"}</button>
            </form>
        </div>
        <div>
            {trialSummary && trialSummary.map((summary) => {
                if (summary) {
                    return <TrialSummary summary={summary}/>
                }
                return null;
            })}
        </div>
    </div>
  );
}

export default App;