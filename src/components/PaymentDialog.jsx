import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, TextField, Button, MenuItem, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, Divider, CircularProgress, Alert,
  Chip, Avatar
} from '@mui/material';
import DeleteIcon      from '@mui/icons-material/Delete';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ReceiptIcon     from '@mui/icons-material/Receipt';
import api from '../services/api';
import { Receipt } from './Receipt';

const fmt = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(v) || 0);

const FORMAS_PAGAMENTO = [
  { value: 'dinheiro',       label: '💵 Dinheiro' },
  { value: 'cartao_credito', label: '💳 Crédito' },
  { value: 'cartao_debito',  label: '💳 Débito' },
  { value: 'pix',            label: '⚡ PIX' },
  { value: 'boleto',         label: '📄 Boleto' },
  { value: 'transferencia',  label: '🏦 Transferência' },
];

export const PaymentDialog = ({
  open, onClose, paciente,
  agendamentos = [],   // [{ id, procedimento, procedimento_nome, valor }]
  onPaymentComplete, loja,
}) => {
  const [cart,               setCart]               = useState([]);
  const [paymentMethod,      setPaymentMethod]      = useState('dinheiro');
  const [receivedValue,      setReceivedValue]      = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [loading,            setLoading]            = useState(false);
  const [error,              setError]              = useState('');
  const [paymentSuccess,     setPaymentSuccess]     = useState(false);
  const [pagamentoRealizado, setPagamentoRealizado] = useState(null);

  useEffect(() => {
    if (!open) return;
    setPaymentMethod('dinheiro');
    setReceivedValue('');
    setDiscountPercentage(0);
    setError('');
    setPaymentSuccess(false);
    setPagamentoRealizado(null);

    if (agendamentos && agendamentos.length > 0) {
      setCart(agendamentos.map(a => ({
        agendamento_id:         a.id,
        procedimento_nome:      a.procedimento?.nome || a.procedimento || a.procedimento_nome || 'Procedimento',
        procedimento_descricao: a.procedimento_descricao || a.observacoes || '',
        valor:                  parseFloat(a.valor) || 0,
      })));
    } else if (paciente?.id) {
      api.get(`/agendamentos?paciente_id=${paciente.id}&status=pendente_pagamento`)
        .then(res => {
          const data = Array.isArray(res.data) ? res.data : [];
          setCart(data.map(a => ({
            agendamento_id:    a.id,
            procedimento_nome: a.procedimento?.nome || a.procedimento || 'Procedimento',
            procedimento_descricao: a.observacoes || '',
            valor:             parseFloat(a.valor) || 0,
          })));
        })
        .catch(() => setCart([]));
    } else {
      setCart([]);
    }
  }, [open, agendamentos, paciente?.id]);

  const subtotal    = cart.reduce((s, i) => s + (parseFloat(i.valor) || 0), 0);
  const discountVal = subtotal * (discountPercentage / 100);
  const total       = Math.max(0, subtotal - discountVal);
  const received    = parseFloat(receivedValue) || 0;
  const change      = paymentMethod === 'dinheiro' ? Math.max(0, received - total) : 0;
  const canPay      = total > 0 && cart.length > 0 &&
    (paymentMethod !== 'dinheiro' || received >= total);

  const removeFromCart  = (idx)         => setCart(prev => prev.filter((_,i) => i !== idx));
  const updateItemValue = (idx, value)  => setCart(prev =>
    prev.map((item, i) => i === idx ? { ...item, valor: parseFloat(value) || 0 } : item)
  );

  const handlePayment = async () => {
    if (!canPay) return;
    if (!paciente?.id) { setError('Paciente não identificado'); return; }
    setLoading(true); setError('');
    try {
      const response = await api.post('/pagamentos', {
        paciente_id:     paciente.id,
        agendamentos:    cart,
        subtotal, desconto: discountVal, total,
        forma_pagamento: paymentMethod,
        recebido:        paymentMethod === 'dinheiro' ? received : total,
        troco:           paymentMethod === 'dinheiro' ? change : 0,
      });
      setPagamentoRealizado(response.data);
      setPaymentSuccess(true);
      onPaymentComplete?.(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao processar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  if (paymentSuccess && pagamentoRealizado) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}>
        <Receipt pagamento={pagamentoRealizado} paciente={paciente} onClose={onClose} loja={loja}/>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={() => { if (!loading) onClose(); }} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}>
      <Box sx={{ height: 4, bgcolor: '#0052CC' }}/>

      <DialogTitle sx={{ borderBottom: '1px solid #F1F5F9', pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: '#EFF6FF', color: '#1E40AF', width: 40, height: 40 }}>
            <AttachMoneyIcon/>
          </Avatar>
          <Box>
            <Typography fontWeight={800} fontSize="1rem">Finalizar Pagamento</Typography>
            {paciente && (
              <Typography variant="caption" color="text.secondary">
                {paciente.nome || paciente.name}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Procedimentos */}
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B',
          textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem' }}>
          Procedimentos
        </Typography>

        {cart.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center', color: '#94A3B8' }}>
            <ReceiptIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }}/>
            <Typography fontSize="0.85rem">Nenhum procedimento</Typography>
            <Typography fontSize="0.75rem" sx={{ mt: 0.5 }}>
              Procedimentos com pagamento pendente aparecem automaticamente
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 1, mb: 2, borderRadius: '8px' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#64748B' }}>Procedimento</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.72rem', color: '#64748B', width: 120 }}>Valor</TableCell>
                  <TableCell sx={{ width: 40 }}/>
                </TableRow>
              </TableHead>
              <TableBody>
                {cart.map((item, idx) => (
                  <TableRow key={idx} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell>
                      <Typography fontSize="0.8rem" fontWeight={600}>{item.procedimento_nome}</Typography>
                      {item.procedimento_descricao && (
                        <Typography fontSize="0.68rem" color="text.secondary">{item.procedimento_descricao}</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <TextField size="small" value={item.valor}
                        onChange={(e) => updateItemValue(idx, e.target.value)}
                        type="number" inputProps={{ min: 0, step: 0.01, style: { textAlign: 'right', fontSize: '0.8rem', width: 90 } }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}/>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => removeFromCart(idx)}
                        sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEF2F2' } }}>
                        <DeleteIcon sx={{ fontSize: 16 }}/>
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Desconto */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField size="small" label="Desconto (%)" type="number" value={discountPercentage}
            onChange={(e) => setDiscountPercentage(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
            inputProps={{ min: 0, max: 100, step: 1 }} sx={{ width: 140 }}/>
          {discountPercentage > 0 && (
            <Chip label={`- ${fmt(discountVal)}`} size="small" color="warning"
              sx={{ fontWeight: 700, fontSize: '0.75rem' }}/>
          )}
        </Box>

        <Divider sx={{ my: 1.5 }}/>

        {/* Totais */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
          {discountPercentage > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography fontSize="0.82rem" color="text.secondary">Subtotal</Typography>
              <Typography fontSize="0.82rem">{fmt(subtotal)}</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography fontSize="0.95rem" fontWeight={800}>Total</Typography>
            <Typography fontSize="1.15rem" fontWeight={800} color="#0052CC">{fmt(total)}</Typography>
          </Box>
        </Box>

        {/* Formas de pagamento */}
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B',
          textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem', display: 'block', mb: 1 }}>
          Forma de Pagamento
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
          {FORMAS_PAGAMENTO.map(fp => (
            <Chip key={fp.value} label={fp.label} onClick={() => setPaymentMethod(fp.value)}
              variant={paymentMethod === fp.value ? 'filled' : 'outlined'}
              sx={{
                cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem',
                bgcolor:     paymentMethod === fp.value ? '#0052CC' : 'transparent',
                color:       paymentMethod === fp.value ? '#fff' : '#475569',
                borderColor: paymentMethod === fp.value ? '#0052CC' : '#E2E8F0',
                '&:hover': { bgcolor: paymentMethod === fp.value ? '#0747A6' : '#F1F5F9' },
              }}/>
          ))}
        </Box>

        {/* Valor recebido — só dinheiro */}
        {paymentMethod === 'dinheiro' && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField size="small" label="Valor recebido (R$)" type="number"
              value={receivedValue} onChange={(e) => setReceivedValue(e.target.value)}
              inputProps={{ min: 0, step: 0.01 }} sx={{ flex: 1 }} autoFocus/>
            {received >= total && total > 0 && (
              <Box sx={{ textAlign: 'right', minWidth: 90 }}>
                <Typography fontSize="0.72rem" color="text.secondary">Troco</Typography>
                <Typography fontSize="1rem" fontWeight={800} color="#10B981">{fmt(change)}</Typography>
              </Box>
            )}
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: '8px', py: 0.5 }}>{error}</Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1, borderTop: '1px solid #F1F5F9', gap: 1 }}>
        <Button onClick={onClose} disabled={loading} variant="outlined"
          sx={{ borderColor: '#E2E8F0', color: '#64748B' }}>
          Cancelar
        </Button>
        <Button onClick={handlePayment} variant="contained"
          disabled={!canPay || loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit"/> : <AttachMoneyIcon/>}
          sx={{ flex: 1, bgcolor: '#0052CC', '&:hover': { bgcolor: '#0747A6' }, fontWeight: 700 }}>
          {loading ? 'Processando...' : `Confirmar ${fmt(total)}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};