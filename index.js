import express from 'express';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

// Token do bot e chat do grupo
const BOT_TOKEN = "8363385190:AAGwauwe-TK-_FwSNWdIbywkCvgsH_t3fx8";
const GROUP_ID = "-1003243962325";

// Função para salvar a compra no sales.json
function saveSale(data){
  const file = path.join(process.cwd(),'sales.json');
  let arr = [];
  if(fs.existsSync(file)){
    try {
      arr = JSON.parse(fs.readFileSync(file));
    } catch(e){
      console.error('Erro ao ler sales.json:', e.message);
    }
  }
  arr.push({timestamp: Date.now(), data});
  fs.writeFileSync(file, JSON.stringify(arr,null,2));
  console.log('Compra salva em sales.json');
}

// Função para formatar a mensagem para Telegram
function formatMessage(evt){
  const c = evt.customer || {};
  const t = evt.transaction || {};
  const msg = `🎉 Compra aprovada!\n🆔 ID Cliente: ${c.chat_id || ''}\n🔗 Username: ${c.username || ''}\n👤 Nome de Perfil: ${c.profile_name || ''}\n👤 Nome Completo: ${c.full_name || ''}\n💳 CPF/CNPJ: ${c.tax_id || ''}\n📦 Categoria: ${t.category || ''}\n🎁 Plano: ${t.plan_name || ''}\n📅 Duração: ${t.plan_duration || ''}\n💰 Valor: R$ ${(t.plan_value/100).toFixed(2)}\n🔑 Transação Interna: ${t.internal_transaction_id || ''}\n🏷️ Transação Gateway: ${t.external_transaction_id || ''}\n💳 Método Pagamento: ${t.payment_method || ''}\n🏦 Plataforma: ${t.payment_platform || ''}`;
  return msg;
}

// Função para enviar a mensagem para Telegram com log
async function sendTelegram(msg){
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try{
    const res = await fetch(url, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({chat_id: GROUP_ID, text: msg})
    });
    const data = await res.json();
    if(data.ok){
      console.log('Mensagem enviada para Telegram com sucesso!');
    } else {
      console.error('Erro ao enviar mensagem para Telegram:', data);
    }
  } catch(err){
    console.error('Erro no fetch do Telegram:', err.message);
  }
}

// Rota webhook
app.post('/webhook', async(req,res)=>{
  const body = req.body;
  console.log('=== Evento recebido ===');
  console.log(JSON.stringify(body,null,2));

  if(body.event==='purchase' || body.event==='payment_approved'){
    saveSale(body);
    const message = formatMessage(body);
    await sendTelegram(message);
  } else {
    console.log('Evento ignorado:', body.event);
  }

  res.json({status:'ok'});
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Webhook rodando na porta ${PORT}`));
