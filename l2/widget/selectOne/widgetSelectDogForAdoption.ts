/// <mls shortName="widgetSelectDogForAdoption" project="100554" enhancement="_100554_enhancementLit" folder="widget/selectOne" groupName="other">
import { html, LitElement, repeat, TemplateResult } from 'lit';
import { customElement, property,state } from 'lit/decorators.js';
import { CollabLitElement } from '/_100554_/l2/collabLitElement.js';
import { propertyDataSource, propertyCompositeDataSource } from '/_100554_/l2/collabDecorators';
/// **collab_i18n_start**
const message_pt = {
    selectDog: 'Selecione um cachorro para adoção',
    name: 'Nome',
    age: 'Idade',
    breed: 'Raça',
    noDogs: 'Nenhum cachorro disponível',
}
const message_en = {
    selectDog: 'Select a dog for adoption',
    name: 'Name',
    age: 'Age',
    breed: 'Breed',
    noDogs: 'No dogs available',
}
type MessageType = typeof message_en;
const messages: { [key: string]: MessageType } = {
    'en': message_en,
    'pt': message_pt
}
/// **collab_i18n_end**
interface Dog {
    name: string;
    age: number;
    breed: string;
    photo: string;
}
@customElement('widget--select-one--widget-select-dog-for-adoption-102026')
export class WidgetSelectDogForAdoption extends CollabLitElement {
    private myMessage: MessageType = messages['en'];
    /**
     * Lista de cachorros disponíveis para adoção.
     * @example [{name: 'Rex', age: 2, breed: 'Labrador', photo: 'url'}]
     */
    @property() list: string | undefined;
    /**
     * Índice do cachorro selecionado.
     * @example 0
     */
    @propertyDataSource({ type: Number }) selected: number | undefined;
    /**
     * Filtro opcional para raça do cachorro.
     * @example 'Labrador'
     */
    @propertyCompositeDataSource({ type: String }) filterBreed: string = '';
    /**
     * Filtro opcional para faixa etária do cachorro.
     * @example '1-3'
     */
    @propertyCompositeDataSource({ type: String }) filterAge: string = '';
    @propertyDataSource({ type: String }) ariaLabel: string = '';
    @propertyDataSource({ type: String }) role: string = 'listbox';
    @propertyDataSource({ type: String }) ariaDescribedBy: string = '';
    @propertyDataSource({ type: String }) ariaExpanded: string = '';
    @propertyDataSource({ type: String }) ariaSelected: string = '';
    @state() filteredList: Dog[] = [];
    async firstUpdated(changedProperties: Map<PropertyKey, unknown>) {
        super.firstUpdated(changedProperties);
        this.updateFilteredList();
    }
    async updated(changedProperties: Map<PropertyKey, unknown>) {
        super.updated(changedProperties);
        if (changedProperties.has('list') || changedProperties.has('filterBreed') || changedProperties.has('filterAge')) {
            this.updateFilteredList();
        }
    }
    private updateFilteredList() {
        
        if (!this.list) {
            this.filteredList = [];
            return;
        }
        const list = JSON.parse(this.list) as any;
        this.filteredList = list.filter((dog:Dog) => { 
            const breedMatch = !this.filterBreed || dog.breed.toLowerCase().includes(this.filterBreed.toLowerCase());
            const ageMatch = !this.filterAge || this.matchesAge(dog.age);
            return breedMatch && ageMatch;
        });

    }
    private matchesAge(age: number): boolean {
        if (!this.filterAge) return true;
        const parts = this.filterAge.split('-');
        if (parts.length === 2) {
            const min = parseInt(parts[0]);
            const max = parseInt(parts[1]);
            return age >= min && age <= max;
        }
        return false;
    }
    private selectDog(index: number) {
        this.selected = index;
        this.requestUpdate();
    }
    private handleKeyDown(event: KeyboardEvent) {
        if (!this.filteredList.length) return;
        let newIndex = this.selected ?? 0;
        switch (event.key) {
            case 'ArrowDown':
                newIndex = Math.min(newIndex + 1, this.filteredList.length - 1);
                break;
            case 'ArrowUp':
                newIndex = Math.max(newIndex - 1, 0);
                break;
            case 'Enter':
            case ' ':
                this.selectDog(newIndex);
                return;
            default:
                return;
        }
        this.selected = newIndex;
        this.requestUpdate();
        event.preventDefault();
    }
    render() {
        console.info(this.filteredList)
        return html`
<div class="container" role="${this.role}" aria-label="${this.ariaLabel}" aria-describedby="${this.ariaDescribedBy}" tabindex="0" @keydown="${this.handleKeyDown}">
<h2>${this.myMessage.selectDog}</h2>
${this.filteredList.length > 0 ? html`
<ul class="dog-list">
${repeat(
            this.filteredList,
            ((dog: Dog) => dog.name) as () => string,
            ((dog: Dog, index: number) => html`
<li class="dog-item ${this.selected === index ? 'selected' : ''}" @click="${() => this.selectDog(index)}" role="option" aria-selected="${this.selected === index ? 'true' : 'false'}">
<img src="${dog.photo}" alt="${this.myMessage.name}: ${dog.name}" class="dog-photo" />
<div class="dog-info">
<h3>${dog.name}</h3>
<p>${this.myMessage.age}: ${dog.age} anos</p>
<p>${this.myMessage.breed}: ${dog.breed}</p>
</div>
</li>
`) as () => TemplateResult<1>
        )}
</ul>
` : html`
<p>${this.myMessage.noDogs}</p>
`}
</div>
`;
    }
}