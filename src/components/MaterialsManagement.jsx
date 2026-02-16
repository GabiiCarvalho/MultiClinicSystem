import { useState } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  TextField, Button, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, LinearProgress,
  Alert, Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';

const MaterialsManagement = () => {
  const [materials, setMaterials] = useState([
    { id: 1, name: 'Anestésico', quantity: 50, unit: 'ml', minQuantity: 20, price: 45.00 },
    { id: 2, name: 'Luvas', quantity: 200, unit: 'un', minQuantity: 50, price: 0.50 },
    { id: 3, name: 'Máscaras', quantity: 150, unit: 'un', minQuantity: 50, price: 1.20 },
    { id: 4, name: 'Seringas', quantity: 30, unit: 'un', minQuantity: 40, price: 2.50 },
    { id: 5, name: 'Algodão', quantity: 10, unit: 'pacote', minQuantity: 5, price: 8.00 },
  ]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    quantity: 0,
    unit: 'un',
    minQuantity: 0,
    price: 0
  });

  const handleAddMaterial = () => {
    if (editingMaterial) {
      setMaterials(materials.map(m => 
        m.id === editingMaterial.id ? { ...editingMaterial } : m
      ));
      setSnackbar({ open: true, message: 'Material atualizado com sucesso', severity: 'success' });
    } else {
      setMaterials([...materials, { ...newMaterial, id: Date.now() }]);
      setSnackbar({ open: true, message: 'Material adicionado com sucesso', severity: 'success' });
    }
    handleCloseDialog();
  };

  const handleDeleteMaterial = (id) => {
    setMaterials(materials.filter(m => m.id !== id));
    setSnackbar({ open: true, message: 'Material removido com sucesso', severity: 'success' });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMaterial(null);
    setNewMaterial({ name: '', quantity: 0, unit: 'un', minQuantity: 0, price: 0 });
  };

  const getStockStatus = (material) => {
    if (material.quantity <= 0) return { color: 'error', label: 'Esgotado' };
    if (material.quantity <= material.minQuantity) return { color: 'warning', label: 'Baixo' };
    return { color: 'success', label: 'Normal' };
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Gestão de Materiais
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Adicionar Material
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total de Itens
              </Typography>
              <Typography variant="h4">
                {materials.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Valor Total em Estoque
              </Typography>
              <Typography variant="h4">
                R$ {materials.reduce((sum, m) => sum + (m.quantity * m.price), 0).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Itens com Estoque Baixo
              </Typography>
              <Typography variant="h4" color="warning.main">
                {materials.filter(m => m.quantity <= m.minQuantity && m.quantity > 0).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Itens Esgotados
              </Typography>
              <Typography variant="h4" color="error.main">
                {materials.filter(m => m.quantity <= 0).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Material</TableCell>
              <TableCell>Quantidade</TableCell>
              <TableCell>Estoque Mínimo</TableCell>
              <TableCell>Preço Unitário</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {materials.map((material) => {
              const stockStatus = getStockStatus(material);
              return (
                <TableRow key={material.id}>
                  <TableCell>{material.name}</TableCell>
                  <TableCell>{material.quantity} {material.unit}</TableCell>
                  <TableCell>{material.minQuantity} {material.unit}</TableCell>
                  <TableCell>R$ {material.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={stockStatus.label}
                      color={stockStatus.color}
                      size="small"
                      icon={stockStatus.color !== 'success' ? <WarningIcon /> : undefined}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingMaterial(material);
                        setOpenDialog(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteMaterial(material.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingMaterial ? 'Editar Material' : 'Adicionar Material'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Nome do Material"
              value={editingMaterial ? editingMaterial.name : newMaterial.name}
              onChange={(e) => editingMaterial 
                ? setEditingMaterial({ ...editingMaterial, name: e.target.value })
                : setNewMaterial({ ...newMaterial, name: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Quantidade"
              type="number"
              value={editingMaterial ? editingMaterial.quantity : newMaterial.quantity}
              onChange={(e) => editingMaterial
                ? setEditingMaterial({ ...editingMaterial, quantity: parseFloat(e.target.value) })
                : setNewMaterial({ ...newMaterial, quantity: parseFloat(e.target.value) })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Unidade"
              value={editingMaterial ? editingMaterial.unit : newMaterial.unit}
              onChange={(e) => editingMaterial
                ? setEditingMaterial({ ...editingMaterial, unit: e.target.value })
                : setNewMaterial({ ...newMaterial, unit: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Estoque Mínimo"
              type="number"
              value={editingMaterial ? editingMaterial.minQuantity : newMaterial.minQuantity}
              onChange={(e) => editingMaterial
                ? setEditingMaterial({ ...editingMaterial, minQuantity: parseFloat(e.target.value) })
                : setNewMaterial({ ...newMaterial, minQuantity: parseFloat(e.target.value) })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Preço Unitário"
              type="number"
              value={editingMaterial ? editingMaterial.price : newMaterial.price}
              onChange={(e) => editingMaterial
                ? setEditingMaterial({ ...editingMaterial, price: parseFloat(e.target.value) })
                : setNewMaterial({ ...newMaterial, price: parseFloat(e.target.value) })
              }
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleAddMaterial} variant="contained">
            {editingMaterial ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MaterialsManagement;