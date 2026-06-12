import test from 'node:test';
import assert from 'node:assert/strict';
import { handleJsonRpcBody } from '../../src/mcp/handler.js';
import { criteria } from '../../src/services/wcagStore.js';

test('MCP initialize negotiates the current Streamable HTTP protocol', async () => {
  const initialized = await handleJsonRpcBody({ jsonrpc:'2.0', id:0, method:'initialize', params:{ protocolVersion:'2025-06-18' } });

  assert.equal(initialized.result.protocolVersion, '2025-06-18');
  assert.equal(initialized.result.capabilities.tools.listChanged, false);
});

test('MCP notifications produce no JSON-RPC response', async () => {
  const initialized = await handleJsonRpcBody({ jsonrpc:'2.0', method:'notifications/initialized' });

  assert.equal(initialized, null);
});

test('MCP tools/list and call work', async () => {
  const listed = await handleJsonRpcBody({ jsonrpc:'2.0', id:1, method:'tools/list' });
  assert.ok(listed.result.tools.some(t => t.name === 'accessibility_advise_text_layout'));
  assert.ok(listed.result.tools.some(t => t.name === 'accessibility_validate_aria_attributes'));
  assert.ok(listed.result.tools.some(t => t.name === 'search'));
  assert.ok(listed.result.tools.some(t => t.name === 'fetch'));
  assert.ok(listed.result.tools.some(t => t.name === 'get-techniques-for-advisory'));
  assert.ok(listed.result.tools.find(t => t.name === 'search').outputSchema);
  const called = await handleJsonRpcBody({ jsonrpc:'2.0', id:2, method:'tools/call', params:{ name:'wcag_get_criterion', arguments:{ ref_id:'1.4.8' } } });
  assert.equal(called.result.structuredContent.criterion.level, 'AAA');
  assert.deepEqual(called.result.content.map(item => item.type), ['text']);
});

test('MCP returns useful structured errors', async () => {
  const res = await handleJsonRpcBody({ jsonrpc:'2.0', id:3, method:'tools/call', params:{ name:'wcag_get_criterion', arguments:{ ref_id:'9.9.9' } } });
  assert.equal(res.error.data.error_code, 'CRITERION_NOT_FOUND');
});

function firstTechniqueEntry(items) {
  if (!Array.isArray(items)) return null;
  for (const item of items) {
    if (item?.id) return item;
    const nested = firstTechniqueEntry(item?.techniques) || firstTechniqueEntry(item?.using) || firstTechniqueEntry(item?.and);
    if (nested) return nested;
    for (const group of item?.groups || []) {
      const grouped = firstTechniqueEntry(group?.techniques);
      if (grouped) return grouped;
    }
  }
  return null;
}

function technologyFromId(id = '') {
  if (/^ARIA/i.test(id)) return 'aria';
  if (/^C\d+/i.test(id)) return 'css';
  if (/^F\d+/i.test(id)) return 'failures';
  if (/^H\d+/i.test(id)) return 'html';
  if (/^PDF/i.test(id)) return 'pdf';
  if (/^SCR/i.test(id)) return 'client-side-script';
  return 'general';
}

function isGeneratedPlaceholder(technique, criterion) {
  return /^(sufficient|advisory|failure) technique for /i.test(technique.title || '')
    && String(technique.id).replace(/\D/g, '') === String(criterion.id).replace(/\D/g, '');
}

test('get-techniques-for-advisory links techniques only when verified', async () => {
  let criterion;
  let expectedTechnique;
  for (const item of criteria) {
    const technique = firstTechniqueEntry(item.techniques?.sufficient);
    if (technique) {
      criterion = item;
      expectedTechnique = technique;
      break;
    }
  }
  assert.ok(criterion, 'test data should include at least one criterion with a sufficient technique');

  const expectedTechnology = (expectedTechnique.technology || technologyFromId(expectedTechnique.id))
    .toLowerCase().replace(/\s+/g, '-');
  const called = await handleJsonRpcBody({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'get-techniques-for-advisory',
      arguments: { criteria: [criterion.id], technology: expectedTechnology, type: 'sufficient' }
    }
  });

  const [enrichedCriterion] = called.result.structuredContent.criteria;
  assert.equal(enrichedCriterion.id, criterion.id);
  const enrichedTechnique = enrichedCriterion.techniques.sufficient.find(technique => technique.id === expectedTechnique.id);
  assert.ok(enrichedTechnique);

  const text = called.result.content[0].text;
  const w3cLink = new RegExp(`https://www\\.w3\\.org/WAI/WCAG22/Techniques/${expectedTechnology}/${expectedTechnique.id}`);
  if (isGeneratedPlaceholder(expectedTechnique, criterion)) {
    assert.equal(enrichedTechnique.verified, false);
    assert.equal(enrichedTechnique.url, null);
    assert.match(text, /No verified W3C technique URL is available/);
    assert.doesNotMatch(text, w3cLink);
  } else {
    assert.equal(enrichedTechnique.verified, true);
    assert.ok(enrichedTechnique.url?.includes(expectedTechnique.id), 'verified technique should link to its technique page');
    assert.ok(text.includes(enrichedTechnique.url), 'text section should include the technique link');
  }
});
