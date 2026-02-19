import { useState, useContext, useEffect } from "react";
import { PatientsContext } from "../contexts/PatientsContext";
import { AuthContext } from "../contexts/AuthContext";
import {
  Box, Typography, Paper, TextField, Button,
  Autocomplete, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, Alert, Grid, Card, CardContent, Avatar,
  Badge, IconButton, MenuItem, Snackbar
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const themeColors = {
  primary: '#1976d2',
  primaryDark: '#0d47a1',
  secondary: '#e3f2fd',
  text: '#0d47a1',
  background: '#f5f9ff',
  success: '#4caf50',
  warning: '#ff9800'
};

const Receipt = ({ patient, cart, paymentMethod, receivedValue, change, clinicName }) => {
  
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price, 0);
  };

  return (
    <Box className="receipt-print" sx={{
      display: 'none',
      '@media print': {
        display: 'block',
        p: 3,
        width: '80mm',
        margin: '0 auto',
        fontFamily: 'monospace',
        fontSize: '14px'
      }
    }}>
      <Typography variant="h6" align="center" sx={{ fontWeight: 'bold', mb: 1 }}>
        {clinicName?.toUpperCase() || 'CLÍNICA'}
      </Typography>
      <Divider sx={{ my: 1 }} />

      <Box sx={{ mb: 2 }}>
        <Typography><strong>Paciente:</strong> {patient?.name || patient?.nome || 'N/A'}</Typography>
        <Typography><strong>Telefone:</strong> {patient?.phone || patient?.telefone || 'N/A'}</Typography>
        <Typography><strong>Data:</strong> {new Date().toLocaleString()}</Typography>
      </Box>

      <Divider sx={{ my: 1 }} />

      <Box sx={{ mb: 2 }}>
        {cart.map((item, index) => (
          <Box key={index} sx={{ mb: 1 }}>
            <Typography>
              {item.name} - R$ {item.price.toFixed(2)}
              {item.dentist && <Typography variant="caption" display="block">Dentista: {item.dentist}</Typography>}
            </Typography>
          </Box>
        ))}
      </Box>

      <Divider sx={{ my: 1 }} />

      <Box sx={{ mb: 2 }}>
        <Typography><strong>TOTAL:</strong> R$ {calculateTotal().toFixed(2)}</Typography>
        <Typography><strong>Pagamento:</strong> {paymentMethod === 'dinheiro' ? 'Dinheiro' : 
          paymentMethod === 'pix' ? 'PIX' : 
          paymentMethod === 'cartao_debito' ? 'Cartão de Débito' : 
          paymentMethod === 'cartao_credito' ? 'Cartão de Crédito' : paymentMethod}</Typography>
        {paymentMethod === 'dinheiro' && (
          <>
            <Typography><strong>Recebido:</strong> R$ {parseFloat(receivedValue).toFixed(2)}</Typography>
            <Typography><strong>Troco:</strong> R$ {change.toFixed(2)}</Typography>
          </>
        )}
      </Box>

      <Divider sx={{ my: 1 }} />
      <Typography align="center" sx={{ mt: 2 }}>
        Obrigado pela preferência!
      </Typography>
    </Box>
  );
};

const Cashier = () => {
  const { clinicName } = useContext(AuthContext);
  const { patients, marcarComoPago } = useContext(PatientsContext);
  
  const [procedurePrices, setProcedurePrices] = useState({
    "Consulta Odontológica": 150,
    "Limpeza Dental": 200,
    "Clareamento": 800,
    "Extração": 350,
    "Canal": 1200,
    "Microcirurgia": 2500,
    "Aplicação de Botox": 600,
    "Preenchimento": 1200,
    "Lipoaspiração": 5000,
    "Rinoplastia": 8000,
    "Blefaroplastia": 4000,
    "Outros": 300
  });

  const [procedureDescriptions, setProcedureDescriptions] = useState({
    "Consulta Odontológica": "Avaliação inicial com dentista",
    "Limpeza Dental": "Remoção de tártaro e profilaxia",
    "Clareamento": "Clareamento dental a laser",
    "Extração": "Extração de dente",
    "Canal": "Tratamento de canal",
    "Microcirurgia": "Procedimento cirúrgico minimamente invasivo",
    "Aplicação de Botox": "Aplicação de toxina botulínica",
    "Preenchimento": "Preenchimento facial com ácido hialurônico",
    "Lipoaspiração": "Procedimento de lipoaspiração localizada",
    "Rinoplastia": "Cirurgia plástica no nariz",
    "Blefaroplastia": "Cirurgia das pálpebras",
    "Outros": "Outros procedimentos"
  });

  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [discountValue, setDiscountValue] = useState(0);
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receivedValue, setReceivedValue] = useState("");
  const [newProcedure, setNewProcedure] = useState({
    name: '',
    description: '',
    price: 0
  });
  const [editingProcedure, setEditingProcedure] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [procedureToDelete, setProcedureToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Mapear pacientes para o formato esperado
  const patientsList = patients.map(patient => ({
    id: patient.id,
    name: patient.name || patient.nome,
    phone: patient.phone || patient.telefone,
    patient: patient
  }));

  const filteredPatients = patientsList.filter(patient =>
    patient.name?.toLowerCase().includes(searchInput.toLowerCase()) ||
    patient.phone?.includes(searchInput)
  );

  // Verificar pagamentos pendentes ao carregar
  useEffect(() => {
    const pendingPayment = JSON.parse(localStorage.getItem('pendingPayment'));
    
    if (pendingPayment) {
      console.log('Pagamento pendente encontrado:', pendingPayment);
      
      // Buscar o paciente
      const patient = patientsList.find(p => 
        p.phone === pendingPayment.patient?.phone || 
        p.phone === pendingPayment.patient?.telefone ||
        p.name === pendingPayment.patient?.name ||
        p.name === pendingPayment.patient?.nome
      );
      
      if (patient) {
        setSelectedPatient(patient);
        setSearchInput(patient.phone);
        
        // Adicionar ao carrinho
        addToCart({
          name: pendingPayment.procedure || pendingPayment.procedureType,
          price: pendingPayment.valor || procedurePrices[pendingPayment.procedure] || 150,
          description: procedureDescriptions[pendingPayment.procedure] || pendingPayment.procedure,
          dentist: pendingPayment.dentist
        });
        
        // Abrir diálogo de pagamento automaticamente
        setTimeout(() => {
          setOpenPaymentDialog(true);
        }, 500);
        
        showSnackbar('Pagamento pendente carregado!', 'info');
      }
      
      // Limpar o pendingPayment após processar
      localStorage.removeItem('pendingPayment');
    }
  }, [patientsList]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const addToCart = (item) => {
    setCart([...cart, {
      id: Date.now() + Math.random(),
      name: item.name,
      price: item.price,
      description: item.description,
      dentist: item.dentist
    }]);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleAddNewProcedure = () => {
    if (newProcedure.name && newProcedure.price > 0) {
      setProcedurePrices(prev => ({
        ...prev,
        [newProcedure.name]: newProcedure.price
      }));

      setProcedureDescriptions(prev => ({
        ...prev,
        [newProcedure.name]: newProcedure.description
      }));

      setNewProcedure({
        name: '',
        description: '',
        price: 0
      });
      
      showSnackbar('Procedimento adicionado com sucesso!');
    }
  };

  const handleEditProcedure = (procedureName) => {
    setEditingProcedure({
      name: procedureName,
      price: procedurePrices[procedureName],
      description: procedureDescriptions[procedureName],
      originalName: procedureName
    });
    setOpenEditDialog(true);
  };

  const handleSaveEditedProcedure = () => {
    if (editingProcedure) {
      if (editingProcedure.originalName && editingProcedure.originalName !== editingProcedure.name) {
        const { [editingProcedure.originalName]: _, ...newPrices } = procedurePrices;
        const { [editingProcedure.originalName]: __, ...newDescriptions } = procedureDescriptions;

        setProcedurePrices({
          ...newPrices,
          [editingProcedure.name]: editingProcedure.price
        });

        setProcedureDescriptions({
          ...newDescriptions,
          [editingProcedure.name]: editingProcedure.description
        });
      } else {
        setProcedurePrices(prev => ({
          ...prev,
          [editingProcedure.name]: editingProcedure.price
        }));

        setProcedureDescriptions(prev => ({
          ...prev,
          [editingProcedure.name]: editingProcedure.description
        }));
      }

      setOpenEditDialog(false);
      setEditingProcedure(null);
      showSnackbar('Procedimento atualizado com sucesso!');
    }
  };

  const handleDeleteProcedure = (procedureName) => {
    setProcedureToDelete(procedureName);
    setOpenDeleteDialog(true);
  };

  const confirmDeleteProcedure = () => {
    const { [procedureToDelete]: _, ...newPrices } = procedurePrices;
    const { [procedureToDelete]: __, ...newDescriptions } = procedureDescriptions;

    setProcedurePrices(newPrices);
    setProcedureDescriptions(newDescriptions);
    setOpenDeleteDialog(false);
    setProcedureToDelete(null);
    showSnackbar('Procedimento removido com sucesso!');
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((total, item) => total + item.price, 0);
    if (applyDiscount && discountPercentage > 0) {
      return subtotal - (subtotal * (discountPercentage / 100));
    }
    return subtotal;
  };

  useEffect(() => {
    const subtotal = cart.reduce((total, item) => total + item.price, 0);
    if (applyDiscount && discountPercentage > 0) {
      setDiscountValue(subtotal * (discountPercentage / 100));
    } else {
      setDiscountValue(0);
    }
  }, [cart, applyDiscount, discountPercentage]);

  const calculateChange = () => {
    if (paymentMethod === "dinheiro" && receivedValue) {
      return parseFloat(receivedValue) - calculateTotal();
    }
    return 0;
  };

  const handlePayment = async () => {
    if (!selectedPatient || cart.length === 0) {
      showSnackbar('Selecione um paciente e adicione itens ao carrinho', 'warning');
      return;
    }
    
    setPaymentSuccess(true);
    
    // Marcar como pago no contexto
    if (selectedPatient?.id && marcarComoPago) {
      marcarComoPago(selectedPatient.id);
    }
    
    // Salvar no localStorage que o pagamento foi concluído
    const paidAppointments = JSON.parse(localStorage.getItem('paidAppointments') || '[]');
    paidAppointments.push({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientPhone: selectedPatient.phone,
      procedure: cart.map(c => c.name).join(', '),
      date: new Date(),
      total: calculateTotal(),
      paymentMethod: paymentMethod
    });
    localStorage.setItem('paidAppointments', JSON.stringify(paidAppointments));
    
    showSnackbar('Pagamento realizado com sucesso!', 'success');

    setTimeout(() => {
      window.print();
    }, 500);

    setTimeout(() => {
      setOpenPaymentDialog(false);
      setPaymentSuccess(false);
      setCart([]);
      setReceivedValue("");
      setSelectedPatient(null);
      setSearchInput("");
      setDiscountPercentage(0);
      setApplyDiscount(false);
    }, 2000);
  };

  const printReceipt = () => {
    if (!selectedPatient || cart.length === 0) {
      showSnackbar('Selecione um paciente e adicione itens ao carrinho', 'warning');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Recibo ${clinicName || 'Clínica'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              width: 80mm;
              margin: 0 auto;
              padding: 10px;
              font-size: 14px;
            }
            .receipt-header {
              text-align: center;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .receipt-item {
              margin-bottom: 5px;
            }
            .receipt-total {
              font-weight: bold;
              margin-top: 10px;
            }
            .receipt-footer {
              text-align: center;
              margin-top: 15px;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="receipt-header">${(clinicName || 'CLÍNICA').toUpperCase()}</div>
          <div><strong>Paciente:</strong> ${selectedPatient?.name || 'N/A'}</div>
          <div><strong>Telefone:</strong> ${selectedPatient?.phone || 'N/A'}</div>
          <div><strong>Data:</strong> ${new Date().toLocaleString()}</div>
          <hr>
          ${cart.map(item => `
            <div class="receipt-item">
              ${item.name} - R$ ${item.price.toFixed(2)}
              ${item.dentist ? `<br><small>Dentista: ${item.dentist}</small>` : ''}
            </div>
          `).join('')}
          <hr>
          <div class="receipt-total">TOTAL: R$ ${calculateTotal().toFixed(2)}</div>
          <div><strong>Pagamento:</strong> ${paymentMethod === 'dinheiro' ? 'Dinheiro' : 
            paymentMethod === 'pix' ? 'PIX' : 
            paymentMethod === 'cartao_debito' ? 'Cartão de Débito' : 
            paymentMethod === 'cartao_credito' ? 'Cartão de Crédito' : paymentMethod}</div>
          ${paymentMethod === 'dinheiro' ? `
            <div><strong>Recebido:</strong> R$ ${parseFloat(receivedValue || calculateTotal()).toFixed(2)}</div>
            <div><strong>Troco:</strong> R$ ${calculateChange().toFixed(2)}</div>
          ` : ''}
          <div class="receipt-footer">Obrigado pela preferência!</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <Box sx={{
      p: 3,
      backgroundColor: themeColors.background,
      minHeight: '100vh'
    }}>
      {/* Cabeçalho */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        mb: 4,
        backgroundColor: 'white',
        p: 2,
        borderRadius: 2,
        boxShadow: 1
      }}>
        <PointOfSaleIcon sx={{
          fontSize: 40,
          color: themeColors.primary,
          mr: 2
        }} />
        <Typography variant="h4" sx={{
          fontWeight: 'bold',
          color: themeColors.primary
        }}>
          Sistema de Caixa - {clinicName || 'Clínica'}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Seção do Paciente */}
        <Grid item xs={12} md={4}>
          <Paper sx={{
            p: 3,
            height: '100%',
            boxShadow: 2,
            backgroundColor: 'white'
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 3
            }}>
              <PeopleIcon sx={{
                mr: 1,
                color: themeColors.primary
              }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Selecionar Paciente
              </Typography>
            </Box>

            <Autocomplete
              options={filteredPatients}
              getOptionLabel={(option) => `${option.name} (${option.phone})`}
              inputValue={searchInput}
              onInputChange={(e, newValue) => setSearchInput(newValue)}
              onChange={(e, newValue) => {
                setSelectedPatient(newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar paciente por nome ou telefone"
                  fullWidth
                  variant="outlined"
                  size="small"
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: themeColors.primary, mr: 2 }}>
                      {option.name?.charAt(0) || '?'}
                    </Avatar>
                    <Box>
                      <Typography>{option.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.phone}
                      </Typography>
                    </Box>
                  </Box>
                </li>
              )}
            />

            {selectedPatient && (
              <Box sx={{
                mt: 3,
                p: 2,
                backgroundColor: themeColors.secondary,
                borderRadius: 1
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {selectedPatient.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedPatient.phone}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Seção de Procedimentos */}
        <Grid item xs={12} md={4}>
          <Paper sx={{
            p: 3,
            height: '100%',
            boxShadow: 2,
            backgroundColor: 'white'
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 3
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ShoppingCartIcon sx={{
                  mr: 1,
                  color: themeColors.primary
                }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Procedimentos
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2}>
              {Object.entries(procedurePrices).map(([procedure, price]) => (
                <Grid item xs={12} sm={6} key={procedure}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      transition: '0.3s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2,
                        borderColor: themeColors.primary
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {procedure}
                        </Typography>
                        <Box>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProcedure(procedure);
                            }}
                            sx={{ ml: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProcedure(procedure);
                            }}
                          >
                            <DeleteIcon fontSize="small" color="error" />
                          </IconButton>
                        </Box>
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 1,
                          fontSize: '0.75rem',
                          minHeight: '40px'
                        }}
                      >
                        {procedureDescriptions[procedure]}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 'bold',
                          color: themeColors.primary
                        }}
                      >
                        R$ {price.toFixed(2)}
                      </Typography>
                      <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        onClick={() => addToCart({
                          name: procedure,
                          price: price,
                          description: procedureDescriptions[procedure]
                        })}
                        sx={{ mt: 1 }}
                        disabled={!selectedPatient}
                      >
                        Adicionar
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Adicionar Novo Procedimento */}
            <Box sx={{ mt: 3, p: 2, border: `1px dashed ${themeColors.primary}`, borderRadius: 1 }}>
              <Typography variant="h6" sx={{ mb: 2, color: themeColors.primary }}>
                {editingProcedure ? 'Editar Procedimento' : 'Adicionar Novo Procedimento'}
              </Typography>
              <TextField
                label="Nome do Procedimento"
                fullWidth
                value={editingProcedure?.name || newProcedure.name}
                onChange={(e) => editingProcedure
                  ? setEditingProcedure({ ...editingProcedure, name: e.target.value })
                  : setNewProcedure({ ...newProcedure, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Descrição"
                fullWidth
                value={editingProcedure?.description || newProcedure.description}
                onChange={(e) => editingProcedure
                  ? setEditingProcedure({ ...editingProcedure, description: e.target.value })
                  : setNewProcedure({ ...newProcedure, description: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Preço"
                type="number"
                fullWidth
                value={editingProcedure?.price || newProcedure.price}
                onChange={(e) => editingProcedure
                  ? setEditingProcedure({ ...editingProcedure, price: parseFloat(e.target.value) || 0 })
                  : setNewProcedure({ ...newProcedure, price: parseFloat(e.target.value) || 0 })}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={editingProcedure ? handleSaveEditedProcedure : handleAddNewProcedure}
                sx={{
                  backgroundColor: themeColors.primary,
                  '&:hover': { backgroundColor: themeColors.primaryDark }
                }}
                disabled={
                  editingProcedure
                    ? !editingProcedure.name || editingProcedure.price <= 0
                    : !newProcedure.name || newProcedure.price <= 0
                }
              >
                {editingProcedure ? 'Salvar Alterações' : 'Adicionar Procedimento'}
              </Button>
              {editingProcedure && (
                <Button
                  variant="outlined"
                  sx={{ ml: 2 }}
                  onClick={() => {
                    setEditingProcedure(null);
                    setNewProcedure({
                      name: '',
                      description: '',
                      price: 0
                    });
                  }}
                >
                  Cancelar
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Diálogo de Confirmação para Exclusão */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
        >
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogContent>
            <Typography>
              Tem certeza que deseja excluir o procedimento "{procedureToDelete}"?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
            <Button
              onClick={confirmDeleteProcedure}
              color="error"
              variant="contained"
            >
              Excluir
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de Edição */}
        <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Editar Procedimento</DialogTitle>
          <DialogContent>
            {editingProcedure && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  label="Nome do Procedimento"
                  fullWidth
                  value={editingProcedure.name}
                  onChange={(e) => setEditingProcedure({ ...editingProcedure, name: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Descrição"
                  fullWidth
                  multiline
                  rows={2}
                  value={editingProcedure.description}
                  onChange={(e) => setEditingProcedure({ ...editingProcedure, description: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Preço"
                  type="number"
                  fullWidth
                  value={editingProcedure.price}
                  onChange={(e) => setEditingProcedure({ ...editingProcedure, price: parseFloat(e.target.value) || 0 })}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>
                  }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveEditedProcedure} variant="contained">Salvar</Button>
          </DialogActions>
        </Dialog>

        {/* Seção do Carrinho */}
        <Grid item xs={12} md={4}>
          <Paper sx={{
            p: 3,
            boxShadow: 2,
            backgroundColor: 'white'
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 3
            }}>
              <ShoppingCartIcon sx={{
                mr: 1,
                color: themeColors.primary
              }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Carrinho
              </Typography>
            </Box>

            {cart.length > 0 ? (
              <>
                <TableContainer sx={{ maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Item</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="right">Preço</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="right">Ação</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {item.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.description}
                              </Typography>
                              {item.dentist && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                  Dentista: {item.dentist}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography>R$ {item.price.toFixed(2)}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              color="error"
                              size="small"
                              onClick={() => removeFromCart(item.id)}
                              startIcon={<DeleteIcon />}
                            >
                              Remover
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ my: 2 }} />

                <Box sx={{
                  p: 2,
                  backgroundColor: themeColors.secondary,
                  borderRadius: 1,
                  mb: 2
                }}>
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 2
                  }}>
                    <Typography>Subtotal:</Typography>
                    <Typography fontWeight="bold">
                      R$ {cart.reduce((total, item) => total + item.price, 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography>Desconto:</Typography>
                      {applyDiscount && (
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          ({discountPercentage}%)
                        </Typography>
                      )}
                    </Box>
                    <Typography fontWeight="bold">
                      - R$ {discountValue.toFixed(2)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" fontWeight="bold">
                      R$ {calculateTotal().toFixed(2)}
                    </Typography>
                  </Box>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<AttachMoneyIcon />}
                  onClick={() => setOpenPaymentDialog(true)}
                  disabled={!selectedPatient}
                  sx={{ mb: 1 }}
                >
                  Finalizar Venda
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<LocalPrintshopIcon />}
                  onClick={printReceipt}
                  disabled={cart.length === 0}
                >
                  Imprimir Recibo
                </Button>
              </>
            ) : (
              <Box sx={{
                textAlign: 'center',
                p: 4,
                backgroundColor: themeColors.secondary,
                borderRadius: 1
              }}>
                <ShoppingCartIcon sx={{
                  fontSize: 40,
                  color: 'text.disabled',
                  mb: 1
                }} />
                <Typography variant="body1" color="text.secondary">
                  Carrinho vazio
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Adicione itens ao carrinho
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Diálogo de Pagamento */}
      <Dialog
        open={openPaymentDialog}
        onClose={() => setOpenPaymentDialog(false)}
        fullWidth
        maxWidth="md"
        sx={{
          '& .MuiTypography-root': {
            color: themeColors.text
          }
        }}
      >
        <DialogTitle sx={{
          backgroundColor: themeColors.primary,
          color: 'white',
          fontWeight: 'bold'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AttachMoneyIcon sx={{ mr: 1 }} />
            Finalizar Pagamento
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {paymentSuccess ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <CheckCircleOutlineIcon sx={{
                fontSize: 60,
                color: themeColors.success,
                mb: 2
              }} />
              <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
                Pagamento Concluído!
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Obrigado pela preferência. O recibo será impresso automaticamente.
              </Typography>

              {/* Componente de recibo para impressão */}
              <Receipt
                patient={selectedPatient}
                cart={cart}
                paymentMethod={paymentMethod}
                receivedValue={receivedValue || calculateTotal()}
                change={calculateChange()}
                clinicName={clinicName}
              />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* Seção de Itens do Carrinho */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Itens Selecionados
                </Typography>

                <Paper sx={{ p: 2, mb: 3 }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Item</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }} align="right">Preço</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }} align="right">Ação</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cart.map((item) => (
                          <TableRow key={item.id} hover>
                            <TableCell>
                              <Box>
                                <Typography sx={{ fontWeight: 'bold' }}>
                                  {item.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {item.description}
                                </Typography>
                                {item.dentist && (
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    Dentista: {item.dentist}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography sx={{ fontWeight: 'bold' }}>
                                R$ {item.price.toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                color="error"
                                size="small"
                                onClick={() => removeFromCart(item.id)}
                                startIcon={<DeleteIcon />}
                              >
                                Remover
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>

                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setOpenPaymentDialog(false);
                    setSearchInput(selectedPatient?.phone || "");
                  }}
                  sx={{ mb: 2 }}
                >
                  Adicionar Mais Itens
                </Button>
              </Grid>

              {/* Seção de Forma de Pagamento */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Resumo do Pedido
                </Typography>

                <Paper sx={{ p: 2, mb: 3 }}>
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 2
                  }}>
                    <Typography>Subtotal:</Typography>
                    <Typography fontWeight="bold">
                      R$ {cart.reduce((total, item) => total + item.price, 0).toFixed(2)}
                    </Typography>
                  </Box>

                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography>Desconto:</Typography>
                      {applyDiscount && (
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          ({discountPercentage}%)
                        </Typography>
                      )}
                    </Box>
                    <Typography fontWeight="bold">
                      - R$ {discountValue.toFixed(2)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 2
                  }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" fontWeight="bold">
                      R$ {calculateTotal().toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>

                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Forma de Pagamento
                </Typography>

                <Paper sx={{ p: 2 }}>
                  <TextField
                    select
                    fullWidth
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    sx={{ mb: 3 }}
                    variant="outlined"
                    size="small"
                  >
                    <MenuItem value="dinheiro">Dinheiro</MenuItem>
                    <MenuItem value="pix">PIX</MenuItem>
                    <MenuItem value="cartao_debito">Cartão de Débito</MenuItem>
                    <MenuItem value="cartao_credito">Cartão de Crédito</MenuItem>
                  </TextField>

                  {paymentMethod === "dinheiro" && (
                    <>
                      <TextField
                        label="Valor Recebido"
                        type="number"
                        fullWidth
                        value={receivedValue}
                        onChange={(e) => setReceivedValue(e.target.value)}
                        sx={{ mb: 2 }}
                        variant="outlined"
                        size="small"
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>,
                        }}
                      />
                      {receivedValue && parseFloat(receivedValue) > 0 && (
                        <Box sx={{
                          backgroundColor: themeColors.secondary,
                          p: 1.5,
                          borderRadius: 1,
                          mb: 2
                        }}>
                          <Typography>
                            Troco: R$ {calculateChange().toFixed(2)}
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </Paper>

                {/* Seção de Desconto */}
                <Box sx={{ mt: 2, p: 2, border: `1px dashed ${themeColors.primary}`, borderRadius: 1 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Aplicar Desconto
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                      label="Porcentagem de Desconto"
                      type="number"
                      value={discountPercentage}
                      onChange={(e) => {
                        const value = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                        setDiscountPercentage(value);
                      }}
                      disabled={!selectedPatient}
                      sx={{ width: 120 }}
                      InputProps={{
                        endAdornment: <Typography>%</Typography>,
                      }}
                    />
                    <Button
                      variant={applyDiscount ? "contained" : "outlined"}
                      onClick={() => setApplyDiscount(!applyDiscount)}
                      disabled={!discountPercentage || !selectedPatient}
                    >
                      {applyDiscount ? "Remover" : "Aplicar"}
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        {!paymentSuccess && (
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setOpenPaymentDialog(false)}
              variant="outlined"
              sx={{
                color: themeColors.primary,
                borderColor: themeColors.primary
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePayment}
              variant="contained"
              sx={{
                backgroundColor: themeColors.primary,
                '&:hover': {
                  backgroundColor: themeColors.primaryDark
                }
              }}
              disabled={
                cart.length === 0 ||
                (paymentMethod === "dinheiro" &&
                  (!receivedValue || parseFloat(receivedValue) < calculateTotal()))
              }
            >
              Confirmar Pagamento
            </Button>
          </DialogActions>
        )}
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Cashier;