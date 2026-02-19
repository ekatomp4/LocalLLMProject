import TextInputNode from "./functional/TextInputNode.js";
import TextOutputNode from "./functional/TextOutputNode.js";
import FetchTextNode from "./functional/FetchTextNode.js";
import ConstantNumberNode from "./constants/ConstantNumberNode.js";
import ConstantStringNode from "./constants/ConstantStringNode.js";
import MultilineTextInputNode from "./functional/MultilineTextInputNode.js";
import MultilineTextOutputNode from "./functional/MultilineTextOutputNode.js";

// helpers
import ToStringNode from "./helpers/ToStringNode.js";
import ToNumberNode from "./helpers/ToNumberNode.js";

// math
import MathNode from "./math/MathNode.js";

// json
import JSONParseNode from "./json/JSONParseNode.js";
import JSONStringifyNode from "./json/JSONStringifyNode.js";
import FormatBrokenJsonNode from "./json/FormatBrokenJSONNode.js";

// templates
import AsyncNode from "./templates/AsyncNode.js";

const NodeList = {
    // simple
    "custom/text/text_input": TextInputNode,
    "custom/text/text_output": TextOutputNode,
    "custom/text/multiline_text_input": MultilineTextInputNode,
    "custom/text/multiline_text_output": MultilineTextOutputNode,
    // functions
    "custom/async/fetch_text": FetchTextNode,
    // helpers
    "custom/convert/to_string": ToStringNode,
    "custom/convert/to_number": ToNumberNode,
    // constants
    "custom/constants/constant_number": ConstantNumberNode,
    "custom/constants/constant_string": ConstantStringNode,
    // math nodes
    "custom/math/math": MathNode,
    // JSON nodes
    "custom/json/json_parse": JSONParseNode,
    "custom/json/json_stringify": JSONStringifyNode,
    "custom/json/format_broken_json": FormatBrokenJsonNode,

    // templates
    // "custom/templates/async": AsyncNode
};

export default NodeList;