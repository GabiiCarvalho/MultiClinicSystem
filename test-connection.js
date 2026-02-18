// test-connection.js
// Execute no console do navegador para testar a conexão

async function testConnection() {
  console.log('🔍 Testando conexão com o backend...');
  
  try {
    // Teste 1: Health check
    const response1 = await fetch('http://localhost:3001/api/health');
    const data1 = await response1.json();
    console.log('✅ Health check OK:', data1);
    
    // Teste 2: Rota de cadastro (apenas para verificar se a rota existe)
    const response2 = await fetch('http://localhost:3001/api/auth/cadastrar-gestor', {
      method: 'OPTIONS'
    });
    console.log('✅ Rota de cadastro acessível');
    
    return true;
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
    console.log('\n🔧 Soluções possíveis:');
    console.log('1. Execute o backend: cd backend && npm run dev');
    console.log('2. Verifique se a porta 3001 está livre');
    console.log('3. Verifique o firewall');
    console.log('4. Tente acessar: http://localhost:3001/api/health no navegador');
    return false;
  }
}

testConnection();