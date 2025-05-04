// server.js

import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// __dirname workaround for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files (HTML, CSS, JS) from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Backend API endpoint to proxy DeepSeek API
app.post('/api/process', express.json(), async (req, res) => {
  const SYSTEM_PROMPT = `You are a BPMN translator. Given a user description, identify:
                            1) Flow objects: events, tasks, gateways  
                            2) Connecting objects: sequence flows, message flows, associations  
                            3) Swimlanes: pools and lanes  
                            4) Artifacts if present  

                            Output a complete, valid BPMN 2.0 XML using these prefixes:
                            bpmn:definitions(
                              xmlns:tns="http://bpmn.io/schema/bpmn"
                              xmlns:activiti="http://activiti.org/bpmn"
                            )
                            Make sure to use the right namespaces and include a BPMNDI section; do not use placeholders. Always generate the complete BPMN 2.0 XML output, including all required elements and a fully populated bpmndi:BPMNDiagram section. Do not omit any part of the structure or replace content with placeholders such as <!-- Additional edges here -->, <!-- More elements -->, or similar. Avoid any simplifications or disclaimers like:
                              “This is a simplified representation. The actual complete XML would be ~3-4x longer with all elements properly positioned and connected.”
                            The output must be fully self-contained, detailed, and syntactically valid for rendering and analysis.
                            Sometimes the provided text may contain information unrelated to BPM or business processes. Please focus only on the BPM-related parts and ignore everything else. If no relevant information about business processes is found, simply return “No Valid Text.
                            Please note that the described process may sometimes involve the orchestration of multiple actors. If this is the case, make sure to include the appropriate message flows, and carefully handle the presence of multiple start events or end events when necessary.
                            Assign a label or name to each event, task, and gateway, as well as to each outgoing arrow from the gateways.
                            Alway include the correct bpmn:incoming and bpmn:outcoming arrow like that: "
                              <bpmn:startEvent id="StartEvent_1">
                                <bpmn:outgoing>SequenceFlow_1</bpmn:outgoing>
                              </bpmn:startEvent>
                              <bpmn:task id="Task_1">
                                <bpmn:incoming>SequenceFlow_1</bpmn:incoming>
                                <bpmn:outgoing>SequenceFlow_2</bpmn:outgoing>
                              </bpmn:task>
                              <bpmn:endEvent id="EndEvent_1">
                                <bpmn:incoming>SequenceFlow_2</bpmn:incoming>
                              </bpmn:endEvent>”`;

const userPrompt = req.body.prompt;
const modelSelected = req.body.model;
const reasoner = req.body.reasoner;

  let apiUrl = '';
  let apiKey = '';
  let modelName = '';

  // Decide which provider to use
  if (modelSelected === 'chatgpt') {
    apiUrl = 'https://api.openai.com/v1/chat/completions';
    apiKey = process.env.OPENAI_API_KEY;
    modelName = reasoner ? 'o3-2025-04-16' : 'gpt-4o';
    
  } else if (modelSelected === 'deepseek') {
    apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    apiKey = process.env.DEEPSEEK_API_KEY;
    modelName = modelName = reasoner ? 'deepseek-reasoner' : 'deepseek-chat';
  } else {
    return res.status(400).json({ error: 'Invalid model selected' });
  }

  try {
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages:  [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt }
            ],
        stream: true,
        ...(modelName !== 'o3-2025-04-16' && { temperature: 0.0 })
      })
    });
    console.log(apiResponse);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    apiResponse.body.on('data', (chunk) => {
      res.write(chunk);
    });

    apiResponse.body.on('end', () => {
      res.end();
    });

    apiResponse.body.on('error', (err) => {
      console.error('Stream error:', err);
      res.status(500).json({ error: 'Error while streaming response' });
    });

  } catch (error) {
    console.error('Streaming error:', error);
    res.status(500).json({
      error: 'Streaming API error',
      details: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});