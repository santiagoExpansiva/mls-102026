/// <mls shortName="agentCreateWidget3" project="102026" enhancement="_blank" />

import { IAgent, svg_agent } from '/_100554_/l2/aiAgentBase.js';
import { preferModelType, getPromptByHtml } from '/_100554_/l2/aiPrompts.js';
import { initState } from '/_100554_/l2/collabState.js';
import { formatHtml } from '/_100554_/l2/collabDOMSync.js';

import {
    getNextPendingStepByAgentName,
    getNextInProgressStepByAgentName,
    updateStepStatus,
    getNextPendentStep,
    updateTaskTitle
} from "/_100554_/l2/aiAgentHelper.js";

import {
    executeNextStep,
    startNewInteractionInAiTask,
    startNewAiTask,
    addNewStep
} from "/_100554_/l2/aiAgentOrchestration.js";

const agentName = "agentCreateWidget3";

export function createAgent(): IAgent {
    return {
        agentName,
        avatar_url: svg_agent,
        agentDescription: "Especialista em frontend com foco em marketing visual e persuasivo, com a tarefa de criar uma “página” de apresentação para um Web Component fornecido.",
        visibility: "private",
        async beforePrompt(context: mls.msg.ExecutionContext): Promise<void> {
            return _beforePrompt(context);
        },
        async afterPrompt(context: mls.msg.ExecutionContext): Promise<void> {
            return _afterPrompt(context);
        },
        async replayForSupport(context: mls.msg.ExecutionContext, payload: mls.msg.AIPayload[]): Promise<void> {
            return _replayForSupport(payload);
        },
    };
}

const _beforePrompt = async (context: mls.msg.ExecutionContext): Promise<void> => {
    const taskTitle = "Creating.";

    if (!context || !context.message) throw new Error("Invalid context");

    if (!context.task) {

        let pp = context.message.content
            .replace(`@@ ${agentName}`, '')
            .replace(`@@${agentName}`, '').trim()

        pp = extJson(context.message.content).trim();

        const data = mls.common.safeParseArgs(pp)
        if (!('shortName' in data) || !('project' in data)) throw new Error(`[${agentName}] beforePrompt: Invalid prompt structure missing json and prompt`);

        const inputs: any = await getPrompts(data.shortName, data.project, data.folder);
        await startNewAiTask(agentName, taskTitle, context.message.content, context.message.threadId, context.message.senderId, inputs, context, _afterPrompt);

    } else {

        const step: mls.msg.AIAgentStep | null = getNextPendingStepByAgentName(context.task, agentName);

        if (!step) {
            throw new Error(`[${agentName}] beforePrompt: No pending step found for this agent.`);
        }

        context = await updateStepStatus(context, step.stepId, "in_progress");

        if (!step.prompt) throw new Error(`[${agentName}] beforePrompt: No prompt found in step for this agent.`);

        const data = mls.common.safeParseArgs(step.prompt);

        if (!('shortName' in data) || !('project' in data)) throw new Error(`[${agentName}] beforePrompt: Invalid prompt structure missing json and prompt`);

        const inputs = await getPrompts(data.shortName, data.project, data.folder);
        await startNewInteractionInAiTask(agentName, taskTitle, inputs, context, _afterPrompt, step.stepId);
    }
}

const _afterPrompt = async (context: mls.msg.ExecutionContext): Promise<void> => {
    if (!context || !context.message || !context.task) throw new Error("Invalid context");
    const step: mls.msg.AIAgentStep | null = getNextInProgressStepByAgentName(context.task, agentName);
    if (!step) throw new Error(`[${agentName}] afterPrompt: No pending interaction found.`);

    context = await updateStepStatus(context, step.stepId, "completed");
    await updateFile(context);
    await executeNextStep(context);
}

const _replayForSupport = async (payload: mls.msg.AIPayload[]): Promise<void> => {

    const step = payload[0] as mls.msg.AIPayload;
    if (!step || step.type !== 'flexible') throw new Error('Invalid step in create files');

    const content = (step as any).content ? (step as any).content : step.result;

    if (!content) throw new Error('[_replayForSupport] nos found content');

    const prj = mls.actualProject || 0;
    content.project = prj;

    const pageName = step.result.shortName;
    const project = step.result.project;
    const folder = step.result.folder;
    const fileHTML = formatHtml(step.result.html);
    const key = mls.stor.getKeyToFiles(step.result.project, 2, step.result.shortName, step.result.folder, '.html');
    const file = mls.stor.files[key];

    const m = mls.editor.getModels(project, pageName, folder);
    if (m && m.html) m.html.model.setValue(fileHTML)
    else if (file) {

        const oldFileInfo = file.getValueInfo ? await file.getValueInfo() : {} as mls.stor.IFileInfoValue;

        const fileInfo: mls.stor.IFileInfoValue = {
            ...oldFileInfo,
            content: fileHTML,
            contentType: 'string'
        };

        await mls.stor.localStor.setContent(file, fileInfo);
    }


}

async function updateFile(context: mls.msg.ExecutionContext) {
    debugger;
    if (!context || !context.task) throw new Error('Not found context to create files');

    const step = getNextPendentStep(context.task) as mls.msg.AIFlexibleResultStep;

    if (!step || step.type !== 'flexible') throw new Error('Invalid step in create files');

    if (!step.result || !step.result.html) throw new Error('Not found "html"  in addFile files');


    const pageName = step.result.shortName;
    const project = step.result.project;
    const folder = step.result.folder;
    const fileHTML = formatHtml(step.result.html);
    const key = mls.stor.getKeyToFiles(step.result.project, 2, step.result.shortName, step.result.folder, '.html');
    const file = mls.stor.files[key];

    const m = mls.editor.getModels(project, pageName, folder);
    if (m && m.html) m.html.model.setValue(fileHTML)
    else if (file) {

        const oldFileInfo = file.getValueInfo ? await file.getValueInfo() : {} as mls.stor.IFileInfoValue;

        const fileInfo: mls.stor.IFileInfoValue = {
            ...oldFileInfo,
            content: fileHTML,
            contentType: 'string'
        };

        await mls.stor.localStor.setContent(file, fileInfo);
    }

    let aux = '';
    /*if (m && m.ts && m.ts.compilerResults && m.ts.compilerResults.errors.length > 0) {
        aux = ', com ' + m.ts.compilerResults.errors.length + ' erros, favor verificar'

    }*/

    context.task = await updateTaskTitle(context.task, "Widget created" + aux);
    //if (m) await verifyNeedCallFix(m, context, step.stepId);

}

async function verifyNeedCallFix(models: mls.editor.IModels, context: mls.msg.ExecutionContext, stepId: number) {

    let hasErrorLess: boolean = false;
    let hasErrorTypescript: boolean = false;

    if (models.ts) {
        const ok = await mls.l2.typescript.compileAndPostProcess(models.ts, true, false);
        hasErrorTypescript = ok === false;
    }
    if (models.style) {
        const ok = await mls.l2.less.compileStyle(models.style);
        hasErrorLess = ok === false;
    }

    if (!hasErrorLess && !hasErrorTypescript) return;
    if (!models.ts) return;
    const { project, folder, shortName } = models.ts.storFile;
    const res = await fireAgentFix(context, hasErrorLess, hasErrorTypescript, project, folder, shortName, stepId);
    if (res) context = res;

}

async function fireAgentFix(
    context: mls.msg.ExecutionContext,
    hasErrorLess: boolean,
    hasErrorTypescript: boolean,
    project: number,
    folder: string | undefined,
    shortName: string,
    stepId: number
) {

    const page = folder ? `_${project}_${folder}/${shortName}` : `_${project}_${shortName}`

    const nextStepsFix = [];
    let nextStepId = stepId + 1;
    if (hasErrorLess) {
        const data = { page, prompt: 'Fix errors in files', position: 'left', mode: 'less' }
        const newStep: mls.msg.AIPayload = {
            agentName: 'agentFix',
            prompt: JSON.stringify(data),
            status: 'pending',
            stepId: nextStepId,
            interaction: null,
            nextSteps: null,
            rags: null,
            type: 'agent'
        };

        nextStepId = nextStepId + 1;
        nextStepsFix.push(newStep);
    }

    if (hasErrorTypescript) {
        const data = { page, prompt: 'Fix errors in files', position: 'left', mode: 'typescript' }
        const newStep: mls.msg.AIPayload = {
            agentName: 'agentFix',
            prompt: JSON.stringify(data),
            status: 'pending',
            stepId: nextStepId,
            interaction: null,
            nextSteps: null,
            rags: null,
            type: 'agent'
        };
        nextStepsFix.push(newStep);
    }

    return await addNewStep(context, stepId, nextStepsFix);

}

export async function getPrompts(shortName: string, project: number, folder:string): Promise<mls.msg.IAMessageInputType[]> {

    if (!shortName || !project) throw new Error("Invalid Prompt");

    const data = {
        mode: preferModelType("code"),
        ts: await getDefinitionsBaseTSInstruction(shortName, project, folder)
    }

    const prompts = await getPromptByHtml({ project: 102026, shortName: agentName, folder: '', data });

    prompts.push({ type: 'human', content: 'Crie um html conforme as regras' })
    return prompts;
}

async function getDefinitionsBaseTSInstruction(shortName: string, project: number, folder:string): Promise<string> {

    shortName = firstLowercaseLetter(shortName);

    const key = mls.stor.getKeyToFiles(project, 2, shortName, folder, ".ts");
    if (!mls.stor.files[key]) throw new Error("[systemDefinitionsBaseTSInstruction]Not found class base:" + project + "_" + shortName);

    let content = await mls.stor.files[key].getContent() as string;

    if (!content) throw new Error("[systemDefinitionsBaseTSInstruction]Not found content:" + project + "_" + shortName);
    return content
}

function extJson(str: string): string {
    const start = str.indexOf('{');
    const end = str.lastIndexOf('}');

    if (start !== -1 && end !== -1 && end > start) {
        return (str.substring(start, end + 1)).replace(/\\"/g, '"');
    } else {
        return ''; // ou lançar erro, dependendo do caso
    }
}


function firstLowercaseLetter(str: string): string {

    if (str.length === 0) return str;

    const first = str[0];
    const rest = str.slice(1);

    if (first === first.toLowerCase()) {
        return str;
    }

    return first.toLowerCase() + rest;

}