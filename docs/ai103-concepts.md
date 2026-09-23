# AI-103 Concepts Used

## 1. AI Agent

The project uses a Microsoft Foundry Agent named `CampusPlacementAgent`.

The agent is responsible for:
- Understanding student placement questions
- Applying the configured instructions
- Retrieving relevant placement information
- Generating grounded responses
- Handling missing or unavailable information without inventing answers

---

## 2. Retrieval-Augmented Generation (RAG)

The Campus Placement Assistant uses Retrieval-Augmented Generation (RAG).

Instead of relying only on the language model's pretrained knowledge, the agent retrieves relevant information from the project's placement knowledge base before generating an answer.

### RAG flow

Student Query  
→ CampusPlacementAgent  
→ Foundry IQ Knowledge Base  
→ Azure AI Search retrieval  
→ Relevant placement information  
→ Grounded Agent Response

This allows the assistant to answer questions using the project's placement dataset.

---

## 3. Foundry IQ Knowledge Base

The project uses a Foundry IQ knowledge base named:

`campus-placement-knowledge`

The knowledge base provides the retrieval layer used by the agent for placement-related questions.

It contains the project's synthetic placement documents, including:
- Company drive information
- Historical placement information
- Placement FAQs
- Placement policies
- Data dictionary information

---

## 4. Azure AI Search

Azure AI Search is used as the retrieval layer for the placement knowledge base.

It enables the system to:
- Index placement documents
- Search relevant information
- Retrieve relevant document chunks
- Provide retrieved information to the agent for grounded generation

---

## 5. Embeddings

The project uses the embedding model:

`text-embedding-3-small`

Embeddings represent text as numerical vectors so that semantically relevant information can be retrieved even when the wording of the query differs from the wording in the source documents.

---

## 6. Grounded Generation

The agent generates responses using retrieved information from the placement knowledge base.

The instructions explicitly require the agent to:
- Prefer the most relevant source
- Avoid inventing missing information
- Distinguish between company drive eligibility and historical placement data
- State when information is unavailable

This helps reduce unsupported answers.

---

## 7. Tools and Retrieval Capabilities

The agent uses its configured knowledge retrieval capability to access the placement knowledge base.

The frontend and backend do not contain the placement dataset or duplicate the agent's knowledge.

The backend forwards student questions to Microsoft Foundry, while the agent performs the configured retrieval and response generation.

---

## 8. Prompt and Instruction Engineering

The agent contains detailed instructions controlling how placement questions are answered.

The instructions define:
- Source priority
- Eligibility rules
- Historical-data handling
- Multi-company retrieval requirements
- Missing-information behavior
- Synthetic-data disclosure
- Privacy and responsible-use requirements

This makes the agent behavior more consistent and reduces hallucination risk.

---

## 9. AI-103 Architecture

The main AI-103 components are:

Student  
↓  
React + Vite Frontend  
↓  
FastAPI Backend  
↓  
Azure AI Projects SDK  
↓  
Microsoft Foundry Agent  
↓  
Foundry IQ Knowledge Base  
↓  
Azure AI Search  
↓  
Synthetic Placement Documents

The retrieved information is then used to generate the final grounded response.

---

## 10. Technology Summary

| Concept | Project Implementation |
|---|---|
| AI Agent | CampusPlacementAgent |
| Model | GPT-5-mini |
| RAG | Foundry IQ knowledge retrieval |
| Knowledge Base | campus-placement-knowledge |
| Search | Azure AI Search |
| Embeddings | text-embedding-3-small |
| Agent Platform | Microsoft Foundry |
| Backend Integration | Azure AI Projects SDK |
| Backend | FastAPI |
| Frontend | React + Vite |
| Dataset | Synthetic placement dataset |

---

## Project Data Notice

The placement documents used by this project are synthetic data created for academic demonstration purposes. They do not represent official company or university placement data.