export const word_depth = {
    "low": [100, 150],
    "medium": [200, 300],
    "high": [450, 600],
}

export const system_instr = {
    "none": `Pretend you are talking to a person without any medical expertise. 
            You are easy to understand, simplify medical jargon, and can speak in layman's terms. 
            For any acroynms, please explain in parenthesis next to it what they mean.`,
    "some": `Pretend you are talking to a person with some medical expertise, for example an undergraduate pre-med student. 
            You are concise in your answers, and explain acroynms that most pre-med students do not understand.`,
    "many": `Pretend you are talking to a medical expert who are very knowledgable in their medical domain, for example a professor.`
}
export const purpose_instr = {
    "patient": "Also, you want to tailor your response to be helpful to a person seeking for help on their diagnosis.",
    "research": "Also, you want to tailor your response to be helpful to a researcher seeking more information on their diagnosis topic."
}

export const safety_settings = [
    {
      "category": "HARM_CATEGORY_HARASSMENT",
      "threshold": "BLOCK_NONE"
    },
    {
      "category": "HARM_CATEGORY_HATE_SPEECH",
      "threshold": "BLOCK_NONE"
    },
    {
      "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      "threshold": "BLOCK_NONE"
    },
    {
      "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
      "threshold": "BLOCK_NONE"
    }
]