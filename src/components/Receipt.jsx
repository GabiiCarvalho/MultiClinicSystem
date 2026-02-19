import { forwardRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import DownloadIcon from '@mui/icons-material/Download';
import { styled } from '@mui/material/styles';

const ReceiptPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: '400px',
  margin: '0 auto',
  backgroundColor: '#fff',
  fontFamily: '"Courier New", monospace',
  '@media print': {
    boxShadow: 'none',
    margin: 0,
    padding: theme.spacing(2),
  },
}));

const ReceiptHeader = styled(Box)({
  textAlign: 'center',
  marginBottom: 20,
});

const ReceiptInfo = styled(Box)({
  marginBottom: 15,
});

const ReceiptItem = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 5,
});

const ReceiptTotal = styled(Box)({
  fontWeight: 'bold',
  fontSize: '1.2em',
  marginTop: 15,
  marginBottom: 15,
});

const ReceiptFooter = styled(Box)({
  textAlign: 'center',
  marginTop: 20,
  fontStyle: 'italic',
});

export const Receipt = forwardRef(({ pagamento, loja }, ref) => {
  if (!pagamento || !pagamento.paciente) return null;

  const data = new Date(pagamento.data_pagamento);
  const dataFormatada = data.toLocaleDateString('pt-BR');
  const horaFormatada = data.toLocaleTimeString('pt-BR');

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    if (pagamento.paciente.telefone) {
      const telefone = pagamento.paciente.telefone.replace(/\D/g, '');
      let mensagem = `*Comprovante de Pagamento*\n\n`;
      mensagem += `Olá *${pagamento.paciente.nome}*,\n`;
      mensagem += `Seu pagamento foi confirmado!\n\n`;
      mensagem += `📅 Data: ${dataFormatada}\n`;
      mensagem += `💰 Total: R$ ${parseFloat(pagamento.total).toFixed(2)}\n`;
      mensagem += `💳 Forma: ${pagamento.forma_pagamento.toUpperCase()}\n\n`;
      mensagem += `*Procedimentos:*\n`;
      
      pagamento.itens?.forEach(item => {
        mensagem += `• ${item.procedimento_nome} - R$ ${parseFloat(item.valor).toFixed(2)}\n`;
      });
      
      mensagem += `\n✅ Pagamento confirmado com sucesso!`;
      
      const link = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
      window.open(link, '_blank');
    }
  };

  const handleDownload = () => {
    const content = document.getElementById('receipt-content').innerHTML;
    const style = `
      <style>
        body { font-family: 'Courier New', monospace; width: 300px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; font-weight: bold; margin-bottom: 20px; }
        .info { margin-bottom: 15px; }
        .item { display: flex; justify-content: space-between; margin: 5px 0; }
        .total { font-weight: bold; font-size: 1.2em; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; font-style: italic; }
        hr { border: 1px dashed #000; margin: 15px 0; }
      </style>
    `;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Comprovante ${pagamento.id}</title>
          ${style}
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprovante-${pagamento.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
        <Tooltip title="Imprimir">
          <IconButton onClick={handlePrint} color="primary">
            <PrintIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Baixar HTML">
          <IconButton onClick={handleDownload} color="primary">
            <DownloadIcon />
          </IconButton>
        </Tooltip>
        {pagamento.paciente.telefone && (
          <Tooltip title="Enviar WhatsApp">
            <IconButton onClick={handleWhatsApp} sx={{ color: '#25D366' }}>
              <WhatsAppIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <ReceiptPaper ref={ref} id="receipt-content">
        <ReceiptHeader>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {loja?.nome?.toUpperCase() || 'CLÍNICA'}
          </Typography>
          {loja?.endereco && (
            <Typography variant="caption" display="block">
              {loja.endereco}
            </Typography>
          )}
        </ReceiptHeader>

        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

        <ReceiptInfo>
          <Typography variant="subtitle2" align="center" gutterBottom>
            COMPROVANTE DE PAGAMENTO
          </Typography>
          <Typography variant="body2">
            Data: {dataFormatada} {horaFormatada}
          </Typography>
          <Typography variant="body2">
            Pagamento #{pagamento.id}
          </Typography>
        </ReceiptInfo>

        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

        <ReceiptInfo>
          <Typography variant="body2">
            <strong>PACIENTE</strong>
          </Typography>
          <Typography variant="body2">{pagamento.paciente.nome}</Typography>
          <Typography variant="body2">{pagamento.paciente.telefone}</Typography>
        </ReceiptInfo>

        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

        <Typography variant="body2" gutterBottom>
          <strong>PROCEDIMENTOS</strong>
        </Typography>

        {pagamento.itens?.map((item, index) => (
          <ReceiptItem key={index}>
            <Typography variant="body2">
              {item.procedimento_nome}
            </Typography>
            <Typography variant="body2">
              R$ {parseFloat(item.valor).toFixed(2)}
            </Typography>
          </ReceiptItem>
        ))}

        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

        <ReceiptTotal>
          <ReceiptItem>
            <Typography>SUBTOTAL:</Typography>
            <Typography>R$ {parseFloat(pagamento.subtotal).toFixed(2)}</Typography>
          </ReceiptItem>
          {pagamento.desconto > 0 && (
            <ReceiptItem>
              <Typography>DESCONTO:</Typography>
              <Typography>- R$ {parseFloat(pagamento.desconto).toFixed(2)}</Typography>
            </ReceiptItem>
          )}
          <ReceiptItem>
            <Typography variant="h6">TOTAL:</Typography>
            <Typography variant="h6">R$ {parseFloat(pagamento.total).toFixed(2)}</Typography>
          </ReceiptItem>
          <ReceiptItem>
            <Typography>FORMA DE PAGAMENTO:</Typography>
            <Typography>{pagamento.forma_pagamento.toUpperCase()}</Typography>
          </ReceiptItem>
          {pagamento.forma_pagamento === 'dinheiro' && (
            <>
              <ReceiptItem>
                <Typography>RECEBIDO:</Typography>
                <Typography>R$ {parseFloat(pagamento.recebido).toFixed(2)}</Typography>
              </ReceiptItem>
              <ReceiptItem>
                <Typography>TROCO:</Typography>
                <Typography>R$ {parseFloat(pagamento.troco).toFixed(2)}</Typography>
              </ReceiptItem>
            </>
          )}
        </ReceiptTotal>

        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

        <ReceiptInfo>
          <Typography variant="body2">
            <strong>ATENDENTE</strong>
          </Typography>
          <Typography variant="body2">{pagamento.usuario?.nome || '—'}</Typography>
        </ReceiptInfo>

        <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

        <ReceiptFooter>
          <Typography variant="body2">
            Obrigado pela preferência!<br />
            Volte sempre ❤️
          </Typography>
        </ReceiptFooter>
      </ReceiptPaper>
    </Box>
  );
});

Receipt.displayName = 'Receipt';