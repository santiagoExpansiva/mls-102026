/// <mls shortName="index" project="102026" enhancement="_blank" folder="widget/selectOne" />

export const widgetDefinition = {
    name: "selectOne",
    description: "Widget that allows selecting a single item",
    properties: [
        {
            name: "list",
            type: "array",
            description: "List of available options",
            itemsType: "object"
        },
        {
            name: "selected",
            type: "number",
            description: "Index or ID of the selected item"
        }
    ]
}