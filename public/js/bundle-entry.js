import * as BpmnAutoLayout from 'bpmn-auto-layout';
import lintModule   from 'bpmn-js-bpmnlint';
import lintConfig   from '../.bpmnlintrc';     // trasformato dal plug-in Rollup

// Esponi su window per gli script non-ESM
window.BpmnJsBpmnlint = lintModule;
window.BpmnLintConfig = lintConfig;

// Rendi disponibile globalmente
window.BpmnAutoLayout = BpmnAutoLayout;