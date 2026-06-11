import { wcag_get_criterion } from '../tools/wcagGetCriterion.js';
import { wcag_search } from '../tools/wcagSearch.js';
import { wcag_get_techniques } from '../tools/wcagGetTechniques.js';
import { wcag_get_failures } from '../tools/wcagGetFailures.js';
import { wcag_get_glossary_term } from '../tools/wcagGetGlossaryTerm.js';
import { accessibility_advise_text_layout, accessibility_advise_colour_contrast, accessibility_advise_focus_visible, accessibility_advise_form_errors, accessibility_advise_component, accessibility_check_css_rule, accessibility_get_component_requirements } from '../tools/advisorTools.js';
export const tools=[wcag_get_criterion,wcag_search,wcag_get_techniques,wcag_get_failures,wcag_get_glossary_term,accessibility_advise_text_layout,accessibility_advise_colour_contrast,accessibility_advise_focus_visible,accessibility_advise_form_errors,accessibility_advise_component,accessibility_check_css_rule,accessibility_get_component_requirements];
export function findTool(name){ return tools.find(t=>t.name===name); }
