/// <mls shortName="agentCreateWidget2" project="102026" enhancement="_blank" />

import { IAgent, svg_agent } from '/_100554_/l2/aiAgentBase.js';
import {
    preferModelType,
    systemTokensLessInstruction,
    getPromptByHtml
} from '/_100554_/l2/aiPrompts.js';

import {
    getNextPendingStepByAgentName,
    getNextInProgressStepByAgentName,
    updateStepStatus,
    getNextPendentStep,
    updateTaskTitle,
} from "/_100554_/l2/aiAgentHelper.js";

import {
    startNewAiTask,
    startNewInteractionInAiTask,
        addNewStep
} from "/_100554_/l2/aiAgentOrchestration.js";

import { formatHtml } from '/_100554_/l2/collabDOMSync.js';
import { createNewFile } from "/_100554_/l2/pluginNewFileBase.js";
//import { initCompileMonaco } from "/_100554_/l2/collabInit.js";

const enhancement = '_100554_enhancementLit';
const agentName = "agentCreateWidget2";
const widgetPrefix = "widget";

export function createAgent(): IAgent {
    return {
        agentName,
        avatar_url: svg_agent,
        agentDescription: "Responsável pela criação de um novo web componente (widget) para o sistema Collab Codes.",
        visibility: "private",
        async beforePrompt(context: mls.msg.ExecutionContext): Promise<void> {
            return _beforePrompt(context);
        },
        async afterPrompt(context: mls.msg.ExecutionContext): Promise<void> {
            return _afterPrompt(context);
        },
        async beforeClarification(context: mls.msg.ExecutionContext, stepId: number): Promise<HTMLDivElement | null> {
            throw new Error('not implemented');
        },
        async afterClarification(context: mls.msg.ExecutionContext, stepId: number, data: object): Promise<void> {
            throw new Error('not implemented');
        }

    }
};

const _beforePrompt = async (context: mls.msg.ExecutionContext): Promise<void> => {
    const taskTitle = "Planning";

    if (!context || !context.message) throw new Error("Invalid context");

    if (!context.task) {
        // using temporary context, create a new task

        let pp = context.message.content
            .replace(`@@ ${agentName}`, '')
            .replace(`@@_102026_/l2/${agentName}`, '')
            .replace(`@@ _102026_/l2/${agentName}`, '')
            .replace(`@@${agentName}`, '').trim()

        pp = extJson(context.message.content).trim();
        const data = mls.common.safeParseArgs(pp);
    
        const inputs = await getPrompts(data, data.prompt);
        await startNewAiTask(agentName, taskTitle, context.message.content, context.message.threadId, context.message.senderId, inputs, context, _afterPrompt);
    } else {

        const step: mls.msg.AIAgentStep | null = getNextPendingStepByAgentName(context.task, agentName);
        if (!step) {
            throw new Error(`[${agentName}] beforePrompt: No pending step found for this agent.`);
        }

        context = await updateStepStatus(context, step.stepId, "in_progress");

        if (!step.prompt) throw new Error(`[${agentName}] beforePrompt: No prompt found in step for this agent.`);
        const data = mls.common.safeParseArgs(step.prompt);
        if (!('json' in data) || !('prompt' in data)) throw new Error(`[${agentName}] beforePrompt: Invalid prompt structure missing json and prompt`);

        const inputs = await getPrompts(data.json, data.prompt);

        await startNewInteractionInAiTask(agentName, taskTitle, inputs, context, _afterPrompt, step.stepId);
    }
}

const _afterPrompt = async (context: mls.msg.ExecutionContext): Promise<void> => {
    if (!context || !context.message || !context.task) throw new Error("Invalid context");
    const step: mls.msg.AIAgentStep | null = getNextInProgressStepByAgentName(context.task, agentName);
    if (!step) throw new Error(`[${agentName}] afterPrompt: No pending interaction found.`);

    context = await updateStepStatus(context, step.stepId, "completed");
    await addFile(context);


}

const _replayForSupport = async (payload: mls.msg.AIPayload[]): Promise<void> => {

    const step = payload[0] as mls.msg.AIPayload;
    if (!step || step.type !== 'flexible') throw new Error('Invalid step in create files');

    const content = (step as any).content ? (step as any).content : step.result;

    if (!content || !content.html || !content.ts || !content.less || !content.shortName) throw new Error('Not found "html" or "ts" or "less" or "shortName" in addFile files');

    const prj = mls.actualProject || 0;
    content.project = prj;

    await createNewFiles(content);


}

async function addFile(context: mls.msg.ExecutionContext) {

    if (!context || !context.task) throw new Error('Not found context to create files');
    const step = getNextPendentStep(context.task);

    if (!step || step.type !== 'flexible') throw new Error('Invalid step in create files');

    const content = (step as any).content ? (step as any).content : step.result;

    if (!content || !content.html || !content.ts || !content.less || !content.shortName) throw new Error('Not found "html" or "ts" or "less" or "shortName" in addFile files');

    const prj = mls.actualProject || 0;

    content.project = prj;

    await createNewFiles(content);

    const rc = { shortName: content.shortName, project: prj, folder:content.folder }

    const newStep: mls.msg.AIPayload = {
        agentName: 'agentCreateWidget3',
        prompt: JSON.stringify(rc),
        status: 'pending',
        stepId: step.stepId + 1,
        interaction: null,
        nextSteps: null,
        rags: null,
        type: 'agent'
    }

    await addNewStep(context, step.stepId, [newStep]);

    let aux = '';
    const m = mls.editor.getModels(prj, content.pageName, '');
    if (m && m.ts && m.ts.compilerResults && m.ts.compilerResults.errors.length > 0) {

    }

    //context.task = await updateTaskTitle(context.task, "Widget created " + content.pageName + aux);

    context = await updateStepStatus(context, step.stepId, "completed");

}

async function createNewFiles(content: { shortName: string, folder:string, html: string, ts: string, less: string, project: number }) {


    //if (content.project) await initCompileMonaco(content.project);

    const pageName = content.shortName;
    const folder = content.folder || '';
    const fileHTML = formatHtml(content.html);
    const fileTS = content.ts;
    const fileLess = content.less;

    await createNewFile(
        { project: content.project, position: 'right', shortName: pageName, enhancement, folder, sourceTS: fileTS, sourceHTML: fileHTML, sourceLess: fileLess, openPreview: false }
    );
}

export async function getPrompts(obj: any, prompt: string | undefined): Promise<mls.msg.IAMessageInputType[]> {
    if (!prompt || prompt.length < 3) throw new Error("Invalid Prompt");

    const tokens = await systemTokensLessInstruction();
    const data = {
        mode: preferModelType("code"),
        requirements: JSON.stringify(obj, null, 2),
        tokens: tokens.content, 
        humanPrompt: prompt
    }

    const prompts = await getPromptByHtml({ project: 102026, shortName: agentName, folder: '', data })
    return prompts;

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
