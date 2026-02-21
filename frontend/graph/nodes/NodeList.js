// Text Input
import TextInputNode from "./nodelist/text/input/TextInputNode.js";
import MultilineTextInputNode from "./nodelist/text/input/MultilineTextInputNode.js";
import ChatInputNode from "./nodelist/text/input/ChatInputNode.js";

// Text Output
import TextOutputNode from "./nodelist/text/output/TextOutputNode.js";
import MultilineTextOutputNode from "./nodelist/text/output/MultilineTextOutputNode.js";
import MDOutputNode from "./nodelist/text/output/MDOutputNode.js";

// Constants
import ConstantNumberNode from "./nodelist/constants/ConstantNumberNode.js";
import ConstantStringNode from "./nodelist/constants/ConstantStringNode.js";
import ToggleNode from "./nodelist/constants/ToggleNode.js";

// Object Editor
import ObjectEditorNode from "./nodelist/obj/ObjectEditorNode.js";

// Async
import FetchTextNode from "./nodelist/async/FetchTextNode.js";

// Async
import LLMStreamNode from "./nodelist/async/LLM/LLMStreamNode.js";
import LLMCallNode from "./nodelist/async/LLM/LLMCallNode.js";
import FunctionNode from "./nodelist/async/FunctionNode.js";
import RunCommandNode from "./nodelist/async/RunCommandNode.js";
import WaitNode from "./nodelist/async/WaitNode.js";

// helpers
import ToStringNode from "./nodelist/helpers/convert/ToStringNode.js";
import ToNumberNode from "./nodelist/helpers/convert/ToNumberNode.js";
import TextToSpeechNode from "./nodelist/helpers/tools/TextToSpeechNode.js";
import PromptBuilderNode from "./nodelist/helpers/tools/PromptBuilderNode.js";
import SelectNode from "./nodelist/helpers/tools/SelectNode.js";

// math
import MathNode from "./nodelist/math/MathNode.js";
import CompareNode from "./nodelist/math/logic/CompareNode.js";

// json
import JSONParseNode from "./nodelist/obj/JSONParseNode.js";
import JSONStringifyNode from "./nodelist/obj/JSONStringifyNode.js";
import FormatBrokenJsonNode from "./nodelist/obj/FormatBrokenJsonNode.js";
import GetObjectProperty from "./nodelist/obj/GetObjectProperty.js";

// templates
import AsyncNode from "./templates/AsyncNode.js";

const NodeList = {
    // simple
    "custom/text/input/text_input": TextInputNode,
    "custom/text/input/chat_input": ChatInputNode,
    "custom/text/output/text_output": TextOutputNode,
    "custom/text/input/multiline_text_input": MultilineTextInputNode,
    "custom/text/output/multiline_text_output": MultilineTextOutputNode,
    "custom/text/output/md_output": MDOutputNode,
    // functions
    "custom/async/fetch_text": FetchTextNode,
    "custom/async/llm/llm_call": LLMCallNode,
    "custom/async/llm/llm_stream": LLMStreamNode,
    "custom/async/function": FunctionNode,
    "custom/async/run_command": RunCommandNode,
    "custom/async/wait": WaitNode,
    // helpers
    "custom/helpers/convert/to_string": ToStringNode,
    "custom/helpers/convert/to_number": ToNumberNode,
    
    "custom/helpers/tools/text_to_speech": TextToSpeechNode,
    "custom/helpers/tools/prompt_builder": PromptBuilderNode,

    "custom/helpers/tools/select": SelectNode,

    // constants
    "custom/constants/constant_number": ConstantNumberNode,
    "custom/constants/constant_string": ConstantStringNode,
    "custom/constants/toggle": ToggleNode,

    // math nodes
    "custom/math/math": MathNode,
    "custom/math/logic/compare": CompareNode,

    // JSON nodes
    "custom/obj/json_parse": JSONParseNode,
    "custom/obj/json_stringify": JSONStringifyNode,
    "custom/obj/format_broken_json": FormatBrokenJsonNode,
    "custom/obj/get_object_property": GetObjectProperty,
    "custom/obj/object_editor": ObjectEditorNode,

    // templates
    // "custom/templates/async": AsyncNode
};


for (const NodeClass of Object.values(NodeList)) {
    const proto = NodeClass.prototype;
    if (!proto.onConfigure) {
        proto.onConfigure = function(o) {
            if (!o.properties) return;
            Object.assign(this.properties, o.properties);
            for (const w of this.widgets ?? []) {
                // try exact name match first, then scan all property values
                if (w.name in this.properties) {
                    w.value = this.properties[w.name];
                } else {
                    // find a property whose value matches the widget's current value type
                    const match = Object.entries(this.properties).find(
                        ([k, v]) => typeof v === typeof w.value
                    );
                    if (match) w.value = match[1];
                }
            }
            this.setDirtyCanvas?.(true);
        };
    }
}

export default NodeList;