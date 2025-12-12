/// <mls shortName="widgetClarificationNewWidget" project="102026" enhancement="_100554_enhancementLit" />

import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { StateLitElement } from '/_100554_/l2/stateLitElement.js';
import { postBackClarification } from "/_100554_/l2/aiAgentOrchestration.js";
import { convertFileNameToTag, convertTagToFileName } from '/_100554_/l2/utilsLit.js';

@customElement('widget-clarification-new-widget-102026')
export class WcClarificationPlannerNewWidget100554 extends StateLitElement {

    private ICABASEPROJECT = 100554;

    @property() data?: ClarificationData;

    @property() error?: string = '';

    @property({ type: Boolean, reflect: true }) develpoment?: boolean = false;

    @property({ type: String, reflect: true }) mode: 'readonly' | 'write' = 'write';

    @query('#input_tagName') inputTag?: HTMLInputElement;
    @query('#widgetNameError') widgetNameError?: HTMLInputElement;

    render() {

        if (this.mode === 'readonly') this.classList.add('readonly');
        else this.classList.remove('readonly');


        if (this.develpoment) this.setDevelpoment();
        if (this.error) {
            return html`
                <div>${this.data?.clarificationMessage}</div>
                <small class="error">${this.data?.clarificationMessage}</small>

                <div class="buttons">
                    <button class="cancel" @click=${this.handleCancel}>Cancelar</button>
                </div>
            `
        }
        return html`

        <div>${this.data?.clarificationMessage}</div>
        <div>
            ${this.data?.json?.map((item) => {
            switch (item.sectionName) {
                case 'resume':
                    return this.renderResume(item);
                case 'parentClass':
                    return this.renderParentClass(item as ClarificationParentName);
                case 'widgetName':
                    return this.renderWidgetName(item as ClarificationWidgetName);
                case 'properties':
                    return this.renderProperties(item as ClarificationProperties);
                case 'requirements':
                    return this.renderRequirements(item as ClarificationRequirements);
            }
        })}
            <div class="buttons">
                <button class="cancel" @click=${this.handleCancel}>Cancelar</button>
                <button class="continue" @click=${this.handleOk}>Continuar</button>
            </div>

        </div>`;
    }

    private renderResume(item: ClarificationResume) {
        return html`
            <div class="section">
                <h2 class="title">${item.sectionName}</h2>
                <p class="desc">${item.description}</p>
            </div>
        `
    }

    private renderParentClass(item: ClarificationParentName) {
        item.widgetName = this.createParentName(item.widgetName);

        return html`
            <div class="section">
                <h2 class="title">${item.sectionName}</h2>
                <p class="desc">${item.description}</p>
                <div>
                    <label>Parent Class:</label>
                    <input
                        @input= ${(e: MouseEvent) => this.handleParentInput(e, item)} 
                        type="text"
                        .value=${item.widgetName}
                    ></input>
                </div>
            </div>
        `
    }

    private renderWidgetName(item: ClarificationWidgetName) {

        if (!item.folder) {
            const base = this.getBase();
            item.folder = `widget/${base}`;
        }

        item.tagName = this.createTagName(item.tagName, item.folder);
        return html`
            <div class="section">
                <h2 class="title">${item.sectionName}</h2>
                <p class="desc">${item.description}</p>
                <div>
                    <label>Widget:</label>
                    <input
                        type="text"
                        .value=${item.widgetName}
                        @input= ${(e: MouseEvent) => this.handleWidgetNameInput(e, item)} 
                    ></input>
                    <small style="color:red" id="widgetNameError"></small>
                </div>
                <div style="margin-top:.5rem">
                    <label>Folder:</label>
                    <input
                        id="input_folder"
                        type="text"
                        readonly
                        style="border:none"}
                        .value=${item.folder}
                    ></input>
                </div>
                <div style="margin-top:.5rem">
                    <label>Tagname:</label>
                    <input
                        id="input_tagName"
                        type="text"
                        readonly
                        style="border:none"
                        @change=${(e: MouseEvent) => this.handleTagNameChange(e, item)}
                        .value=${item.tagName}
                    ></input>
                </div>
            </div>
        `
    }

    private renderProperties(item: ClarificationProperties) {
        return html`
            <div class="section">
                <h2 class="title">${item.sectionName}</h2>
                <p class="desc">${item.description}</p>
                <ul>
                    ${item.properties.map((prop) => html`<li><b>${prop.propertyName}:</b> ${prop.description} (Essencial: ${prop.isEssencial}</li>`)}
                </ul>
            </div>
        `
    }

    private renderRequirements(item: ClarificationRequirements) {
        return html`
            <div class="section">
                <h2 class="title">${item.sectionName}</h2>
                <p class="desc">${item.description}</p>
                
                <h3>Functional Requirements:</h3>
                ${item.functionalRequirements
                ? html`
                        <textarea
                            rows=${item.functionalRequirements.length}
                            .value = "- ${item.functionalRequirements.join('\n -')}"
                            @input=${(e: MouseEvent) => this.handleRqFunctionalInput(e, item)}
                        >
                        </textarea>
                    `
                : ''
            }

                <h3>Visual Requirements</h3>
                ${item.visualRequirements
                ? html`
                        <textarea
                            rows=${item.visualRequirements.length}
                            .value = "- ${item.visualRequirements.join('\n -')}"
                            @input=${(e: MouseEvent) => this.handleRqVisualInput(e, item)}
                        >
                        </textarea>
                    `
                : ''
            }

            </div>
        `
    }

    private createTagName(value: string, folder: string = '') {
        const valueWithoutProject = this.removeTrailingPattern(value);
        const project = mls.actualProject;
        if (!project) return valueWithoutProject;
        return convertFileNameToTag({ project, shortName: valueWithoutProject, folder })
    }

    private removeTrailingPattern(str: string): string {
        return str.replace(/-\d{6}$/, '');
    }

    private createParentName(value: string) {
        const info = convertTagToFileName(`${value}-${this.ICABASEPROJECT}`);
        if (!info) return '';
        let newParentName = info.shortName;
        newParentName = newParentName.endsWith('Base') ? newParentName : `${newParentName}`;
        return newParentName.charAt(0).toLowerCase() + newParentName.slice(1);;
    }

    private handleWidgetNameInput(e: MouseEvent, item: ClarificationWidgetName) {
        const target = e.target as HTMLTextAreaElement;

        const key = mls.stor.getKeyToFiles(this.ICABASEPROJECT, 2, target.value, '', '.ts');
        if (!this.widgetNameError) return;

        if (mls.stor.files[key]) {
            this.widgetNameError.innerHTML = "A widget with this name already exists";
            return;
        };

        if (!target.value.startsWith('widget')) {
            this.widgetNameError.innerHTML = "Component name must start with \"widget\"";
            return;
        }

        this.widgetNameError.innerHTML = "";
        item.widgetName = target.value;
        if (this.inputTag) {
            this.inputTag.value = this.createTagName(target.value);
            const event = new Event('change', { bubbles: true });
            this.inputTag.dispatchEvent(event);
        }
    }

    private handleTagNameChange(e: MouseEvent, item: ClarificationWidgetName) {
        const target = e.target as HTMLTextAreaElement;
        item.tagName = target.value.charAt(0).toLowerCase() + target.value.slice(1);
    }

    private handleParentInput(e: MouseEvent, item: ClarificationParentName) {
        const target = e.target as HTMLTextAreaElement;
        item.widgetName = target.value;
    }

    private handleRqVisualInput(e: MouseEvent, item: ClarificationRequirements) {
        const target = e.target as HTMLTextAreaElement;
        item.visualRequirements = target.value.split('\n');
    }

    private handleRqFunctionalInput(e: MouseEvent, item: ClarificationRequirements) {
        const target = e.target as HTMLTextAreaElement;
        item.functionalRequirements = target.value.split('\n');
    }

    private handleCancel() {
        this.handleAction('cancel');
    }

    private handleOk() {
        let hasError = false;
        this.data?.json?.map((item) => {

            if (item.sectionName === 'widgetName') {

                const key = mls.stor.getKeyToFiles(this.ICABASEPROJECT, 2, (item as ClarificationWidgetName).widgetName, '', '.ts');

                if (!this.widgetNameError) return;

                if (mls.stor.files[key]) {
                    this.widgetNameError.innerHTML = "A widget with this name already exists";
                    hasError = true;
                    return;
                };

                if (!(item as ClarificationWidgetName).widgetName.startsWith('widget')) {
                    this.widgetNameError.innerHTML = "Component name must start with \"widget\"";
                    hasError = true;
                    return;
                }

            }

        })

        if (hasError) return;
        this.handleAction('continue');
    }

    private async handleAction(action: 'cancel' | 'continue') {
        if (!this.data) return;
        if (this.develpoment) {
            console.info(this.data);
            return;
        }
        await postBackClarification(action, this.data);
    }

    private getBase(): string {

        if (!this.data) return '';
        let ret = '';
        this.data.json?.map((item) => {

            if (item.sectionName === 'parentClass') {
                ret = (item as ClarificationParentName).widgetName;
            }
            
        })

        return ret;

    }

    private setDevelpoment() {
        this.data = {
            clarificationMessage: '',
            stepId: 123,
            taskId: '123',
            json: [{ "sectionName": "resume", "description": "Widget para seleção de intervalo de datas, com suporte a limites mínimo/máximo, bloqueio de datas específicas e validação visual clara. Ideal para reservas e agendamentos." }, { "sectionName": "parentClass", "description": "Component for selecting date ranges, useful for period filters.", "widgetName": "IcaFormsInputDateRange" }, { "sectionName": "widgetName", "description": "Nome do Widget", "widgetName": "widgetDateRangeBooking", "tagName": "widget-date-range-booking-100555" }, { "sectionName": "properties", "description": "Propriedades do widget", "properties": [{ "propertyName": "label", "description": "Texto exibido acima do campo de seleção.", "isEssencial": "false" }, { "propertyName": "hint", "description": "Dica ou instrução para o usuário.", "isEssencial": "false" }, { "propertyName": "errormessage", "description": "Mensagem de erro personalizada.", "isEssencial": "false" }, { "propertyName": "name", "description": "Nome do campo para integração com formulários.", "isEssencial": "false" }, { "propertyName": "startvalue", "description": "Data inicial selecionada.", "isEssencial": "false" }, { "propertyName": "endvalue", "description": "Data final selecionada.", "isEssencial": "false" }, { "propertyName": "required", "description": "Define se o campo é obrigatório.", "isEssencial": "false" }, { "propertyName": "disabled", "description": "Desabilita o componente.", "isEssencial": "false" }, { "propertyName": "readonly", "description": "Torna o campo somente leitura.", "isEssencial": "false" }, { "propertyName": "autofocus", "description": "Foca automaticamente no campo ao carregar.", "isEssencial": "false" }, { "propertyName": "minvalue", "description": "Data mínima permitida para seleção.", "isEssencial": "false" }, { "propertyName": "maxvalue", "description": "Data máxima permitida para seleção.", "isEssencial": "false" }, { "propertyName": "blockedDates", "description": "Lista de datas específicas que não podem ser selecionadas (essencial).", "isEssencial": "true" }, { "propertyName": "dropdown", "description": "Exibe o seletor de datas em formato dropdown (essencial).", "isEssencial": "true" }, { "propertyName": "errorPosition", "description": "Posiciona a mensagem de erro acima do componente (essencial).", "isEssencial": "true" }] }, { "sectionName": "requirements", "description": "requisitos para este widget, altere se necessário", "functionalRequirements": ["O usuário deve clicar primeiro na data inicial e depois na data final para confirmar o intervalo.", "A data inicial deve ser obrigatoriamente menor que a data final.", "Cada dia na tabela de datas deve ser um botão clicável.", "Deve ser possível definir datas bloqueadas que não podem ser selecionadas.", "Após a seleção, o componente deve atualizar e exibir o período escolhido, refletindo na propriedade do web-componente.", "O componente deve emitir eventos ou atualizar propriedades para integração com formulários externos."], "visualRequirements": ["O seletor de datas deve ser exibido em formato dropdown.", "A mensagem de erro deve aparecer acima do componente, nunca abaixo.", "Datas bloqueadas devem ser visualmente diferenciadas e não interativas.", "Datas selecionadas (inicial e final) devem ser destacadas.", "O período selecionado deve ser claramente exibido após a seleção."] }]
        }

    }

}

interface ClarificationData {
    json: Clarification[] | undefined,
    taskId: string,
    stepId: number,
    clarificationMessage: string
}

type Clarification = ClarificationResume | ClarificationWidgetName | ClarificationParentName | ClarificationProperties | ClarificationRequirements;

interface ClarificationBase {
    sectionName: string;
    description: string;
}

interface ClarificationResume extends ClarificationBase {
}

interface ClarificationWidgetName extends ClarificationBase {
    widgetName: string;
    tagName: string;
    folder: string
}

interface ClarificationParentName extends ClarificationBase {
    widgetName: string;
}

interface ClarificationProperties extends ClarificationBase {
    properties: {
        propertyName: string;
        description: string;
        isEssencial: string;
    }[];
}

interface ClarificationRequirements extends ClarificationBase {
    functionalRequirements: string[];
    visualRequirements?: string[];
}



