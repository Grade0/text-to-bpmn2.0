// public/js/app.js

// Initialize BPMN Modeler
const modeler = new BpmnJS({ container: '#canvas' });
const chatLog = document.getElementById('chat-log');
const chatInput = document.getElementById('chat-message');
const sidebar = document.getElementById('sidebar');
const fullscreenLabel = document.getElementById('fullscreen-label');
const fileDrop = document.getElementById('file-drop-area');
const fileInput = document.getElementById('file-input');

let isFullscreen = false;

function toggleFullscreen() {
  isFullscreen = !isFullscreen;
  sidebar.style.marginLeft = isFullscreen ? '-35%' : '0';
  fullscreenLabel.textContent = isFullscreen ? 'Collapse' : 'Expand';
}

// Load default BPMN diagram
modeler.importXML(`<?xml version="1.0" encoding="UTF-8"?><bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_0au21k8" targetNamespace="http://bpmn.io/schema/bpmn" exporter="bpmn-js" exporterVersion="13.1.0"><bpmn:process id="Process_1" isExecutable="false"></bpmn:process><bpmndi:BPMNDiagram id="BPMNDiagram_1"><bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1"></bpmndi:BPMNPlane></bpmndi:BPMNDiagram></bpmn:definitions>`);

// Auto resize chat input field
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 160) + 'px';
});

chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendPrompt();
  }
});

// Default System Prompt
const SYSTEM_PROMPT = `You are a BPMN translator. Given a user description, identify BPMN elements and output complete BPMN 2.0 XML.`;

// Handle sending prompt to server
async function sendPrompt(customText = null) {
  const text = (customText || chatInput.value).trim();
  if (!text) return;
  if (!customText) chatInput.value = '';

  const userMessage = document.createElement('div');
  userMessage.className = 'chat-msg user';
  userMessage.innerText = text;
  chatLog.appendChild(userMessage);

  const botTyping = document.createElement('div');
  botTyping.className = 'chat-msg bot';
  botTyping.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
  chatLog.appendChild(botTyping);
  chatLog.scrollTop = chatLog.scrollHeight;

  try {
    const response = await fetch('/api/deepseek', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: text, systemPrompt: SYSTEM_PROMPT })
    });

    const data = await response.json();
    chatLog.removeChild(botTyping);

    const botMessage = document.createElement('div');
    botMessage.className = 'chat-msg bot';
    const content = data.choices[0]?.message?.content || 'No response';
    botMessage.innerHTML = marked.parse(content);
    chatLog.appendChild(botMessage);
    chatLog.scrollTop = chatLog.scrollHeight;

    const xml = extractXmlFromResponse(content);
    if (xml) {
      await modeler.importXML(xml);
      addBotMessage('✅ Diagram generated successfully');
    } else {
      addBotMessage('⚠️ No valid BPMN XML found');
    }

  } catch (error) {
    console.error('API error:', error);
    addBotMessage('❌ Error contacting server');
  }
}

function extractXmlFromResponse(content) {
  const match = content.match(/<bpmn:definitions[\s\S]*?<\/bpmn:definitions>/);
  return match ? match[0] : null;
}

function addBotMessage(text) {
  const msg = document.createElement('div');
  msg.className = 'chat-msg bot';
  msg.innerHTML = marked.parse(text);
  chatLog.appendChild(msg);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function exportXML() {
  modeler.saveXML({ format: true }).then(({ xml }) => download('diagram.bpmn', xml));
}

function exportSVG() {
  modeler.saveSVG().then(({ svg }) => download('diagram.svg', svg));
}

function fitView() {
  modeler.get('canvas').zoom('fit-viewport');
}

function download(filename, data) {
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Fullscreen toggle button
const fullscreenBtn = document.getElementById('toggleFullscreen');
fullscreenBtn.addEventListener('click', toggleFullscreen);

// Send button click
const sendBtn = document.getElementById('send-btn');
sendBtn.addEventListener('click', sendPrompt);

// Template popup
const templateLink = document.getElementById('template-link');
const templatePopup = document.getElementById('template-popup');
templateLink.addEventListener('click', e => {
  e.preventDefault();
  templatePopup.classList.toggle('visible');
});
document.addEventListener('click', e => {
  if (!templatePopup.contains(e.target) && !templateLink.contains(e.target)) {
    templatePopup.classList.remove('visible');
  }
});
