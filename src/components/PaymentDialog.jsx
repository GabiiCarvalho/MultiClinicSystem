import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Divider,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';
import { Receipt } from './Receipt';

export const PaymentDialog = ({ 
  open, 
  onClose, 
  paciente, 
  agendamentos, 
  onPaymentComplete,
  loja 
}) => {
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [receivedValue, setReceivedValue] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [pagamentoRealizado, setPagamentoRealizado] = useState(null);

  useEffect(() => {
    if (agendamentos && agendamentos.length > 0) {
      const itens = agendamentos.map(a => ({
        agendamento_id: a.id,
        procedimento_nome: a.procedimento,
        procedimento_descricao: a.procedimento_descricao || a.observacoes,
        valor: parseFloat(a.valor)
      }));
      setCart(itens);
    }
  }, [agendamentos]);

  const subtotal = cart.reduce((sum, item) => sum + item.valor, 0);
  const discountValue = subtotal * (discountPercentage / 100);
  const total = subtotal - discountValue;
  const change = paymentMethod === 'dinheiro' && receivedValue 
    ? parseFloat(receivedValue) - total 
    : 0;

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handlePayment = async () => {
    if (cart.length === 0 || !paciente) return;

    setLoading(true);
    try {
      const response = await api.post('/pagamentos', {
        paciente_id: paciente.id,
        agendamentos: cart,
        subtotal,
        desconto: discountValue,
        total,
        forma_pagamento: paymentMethod,
        recebido: paymentMethod === 'dinheiro' ? parseFloat(receivedValue) : total,
        troco: paymentMethod === 'dinheiro' ? change : 0
      });

      setPagamentoRealizado(response.data);
      setPaymentSuccess(true);
      
      if (onPaymentComplete) {
        onPaymentComplete(response.data);
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
      alert('Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setPaymentSuccess(false);
      setCart([]);
      setPaymentMethod('dinheiro');
      setReceivedValue('');
      setDiscountPercentage(0);
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth={paymentSuccess ? 'md' : 'sm'}
      fullWidth
    >
      <DialogTitle>
        {paymentSuccess ? 'Pagamento Concluído' : 'Finalizar Pagamento'}
      </DialogTitle>
      
      <DialogContent>
        {paymentSuccess ? (
          <Receipt 
            pagamento={pagamentoRealizado} 
            loja={loja}
          />
        ) : (
          <Box>
            {paciente && (
              <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
                <Typography variant="subtitle2">Paciente:</Typography>
                <Typography variant="body1">{paciente.nome}</Typography>
                <Typography variant="body2">{paciente.telefone}</Typography>
              </Paper>
            )}

            <Typography variant="h6" gutterBottom>
              Itens do Carrinho
            </Typography>

            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Procedimento</TableCell>
                    <TableCell align="right">Valor</TableCell>
                    <TableCell align="right"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cart.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2">
                          {item.procedimento_nome}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        R$ {item.valor.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          onClick={() => removeFromCart(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Forma de Pagamento
              </Typography>
              
              <TextField
                select
                fullWidth
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="dinheiro">Dinheiro</MenuItem>
                <MenuItem value="pix">PIX</MenuItem>
                <MenuItem value="cartao_debito">Cartão de Débito</MenuItem>
                <MenuItem value="cartao_credito">Cartão de Crédito</MenuItem>
              </TextField>

              {paymentMethod === 'dinheiro' && (
                <TextField
                  fullWidth
                  label="Valor Recebido"
                  type="number"
                  value={receivedValue}
                  onChange={(e) => setReceivedValue(e.target.value)}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>
                  }}
                  sx={{ mb: 2 }}
                />
              )}
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Resumo
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal:</Typography>
                <Typography>R$ {subtotal.toFixed(2)}</Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography>Desconto (%):</Typography>
                <TextField
                  type="number"
                  size="small"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  sx={{ width: 100 }}
                  InputProps={{
                    endAdornment: <Typography>%</Typography>
                  }}
                />
                <Typography>- R$ {discountValue.toFixed(2)}</Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">TOTAL:</Typography>
                <Typography variant="h6">R$ {total.toFixed(2)}</Typography>
              </Box>

              {paymentMethod === 'dinheiro' && receivedValue && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#e8f5e8', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Troco:</Typography>
                    <Typography>R$ {change.toFixed(2)}</Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      {!paymentSuccess && (
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handlePayment}
            disabled={
              loading || 
              cart.length === 0 || 
              (paymentMethod === 'dinheiro' && (!receivedValue || parseFloat(receivedValue) < total))
            }
          >
            {loading ? <CircularProgress size={24} /> : 'Confirmar Pagamento'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};