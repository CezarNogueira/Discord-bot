/**
 * Teste Nunjucks - Compatível com ESM
 * Execute: node --loader ts-node/esm test-esm.ts
 * OU: npx tsx test-esm.ts
 */

import nunjucks from "nunjucks";

console.log("\n🧪 TESTE NUNJUCKS (ESM)\n");
console.log("=".repeat(50));

// Teste 1: Variável simples
console.log("\n1️⃣ Teste: Variável simples");
try {
  const result = nunjucks.renderString("Olá {{ name }}!", { name: "Mundo" });
  console.log(`   Input:  "Olá {{ name }}!"`);
  console.log(`   Output: "${result}"`);
  if (result === "Olá Mundo!") {
    console.log("   ✅ PASSOU");
  } else {
    console.log("   ❌ FALHOU");
    process.exit(1);
  }
} catch (err: any) {
  console.log("   ❌ ERRO:", err.message);
  process.exit(1);
}

// Teste 2: Função random
console.log("\n2️⃣ Teste: Função random");
try {
  const result = nunjucks.renderString("Número: {{ random(1, 100) }}", {
    random: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
  });
  console.log(`   Input:  "Número: {{ random(1, 100) }}"`);
  console.log(`   Output: "${result}"`);
  
  const match = result.match(/Número: (\d+)/);
  if (match && !result.includes("{{")) {
    const num = parseInt(match[1]);
    console.log(`   Número gerado: ${num}`);
    if (num >= 1 && num <= 100) {
      console.log("   ✅ PASSOU");
    } else {
      console.log("   ❌ FALHOU");
      process.exit(1);
    }
  } else {
    console.log("   ❌ FALHOU");
    process.exit(1);
  }
} catch (err: any) {
  console.log("   ❌ ERRO:", err.message);
  process.exit(1);
}

// Teste 3: Comando completo
console.log("\n3️⃣ Teste: Comando de RPG completo");
try {
  const template = "🎲 {{ user.mention }} rolou: **{{ random(1, 20) }}**";
  const context = {
    user: {
      mention: "<@123456789>",
    },
    random: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
  };
  
  const result = nunjucks.renderString(template, context);
  console.log(`   Input:  "${template}"`);
  console.log(`   Output: "${result}"`);
  
  if (result.includes("{{") || result.includes("}}")) {
    console.log("   ❌ FALHOU (ainda tem variáveis)");
    process.exit(1);
  } else {
    console.log("   ✅ PASSOU");
  }
} catch (err: any) {
  console.log("   ❌ ERRO:", err.message);
  process.exit(1);
}

console.log("\n" + "=".repeat(50));
console.log("🎉 TODOS OS TESTES PASSARAM!");
console.log("=".repeat(50));
console.log("\n✅ Nunjucks funciona corretamente!");
console.log("\n🔍 Problema está no BOT, não no Nunjucks");
console.log("\n📋 PRÓXIMOS PASSOS:");
console.log("   1. Verificar tsconfig.json");
console.log("   2. Copiar interactionCreate.ts atualizado");
console.log("   3. Re-registrar comandos");
console.log("   4. Reiniciar bot\n");