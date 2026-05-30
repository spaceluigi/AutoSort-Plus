/**
 * Security Unit Tests for AutoSort+
 * Verifies XSS sanitization and safety of HTML escaping helper.
 */

// 1. Replicate the escapeHTML implementation used in options.js
function escapeHTML(str) {
    if (str === undefined || str === null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const testCases = [
    {
        name: "Escape standard script tags",
        input: "<script>alert('XSS')</script>",
        expected: "&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;"
    },
    {
        name: "Escape HTML entities in image onerror source injection",
        input: "<img src=\"invalid\" onerror=\"doEvil()\">",
        expected: "&lt;img src=&quot;invalid&quot; onerror=&quot;doEvil()&quot;&gt;"
    },
    {
        name: "Escape ampersands",
        input: "emails & labels",
        expected: "emails &amp; labels"
    },
    {
        name: "Escape single and double quotes",
        input: "Nigel's \"AutoSort+\"",
        expected: "Nigel&#39;s &quot;AutoSort+&quot;"
    },
    {
        name: "Handle null inputs gracefully",
        input: null,
        expected: ""
    },
    {
        name: "Handle undefined inputs gracefully",
        input: undefined,
        expected: ""
    },
    {
        name: "Handle number inputs correctly",
        input: 42,
        expected: "42"
    }
];

let passed = 0;
let failed = 0;

console.log("🧪 Running AutoSort+ Security Unit Tests...\n");

testCases.forEach((tc, idx) => {
    const actual = escapeHTML(tc.input);
    if (actual === tc.expected) {
        console.log(`✅ [PASS] Test #${idx + 1}: ${tc.name}`);
        passed++;
    } else {
        console.error(`❌ [FAIL] Test #${idx + 1}: ${tc.name}`);
        console.error(`   Input:    ${tc.input}`);
        console.error(`   Expected: ${tc.expected}`);
        console.error(`   Actual:   ${actual}`);
        failed++;
    }
});

console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
    process.exit(1);
} else {
    console.log("🎉 All security unit tests passed successfully!\n");
    process.exit(0);
}
