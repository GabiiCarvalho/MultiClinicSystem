import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  TextField, Button, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Alert, Snackbar,
  MenuItem, InputAdornment, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import api from '../services/api';

const MaterialsManagement = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [stats, setStats] = useState({
    total_materiais: 0,
    valor_total_estoque: 0,
    materiais_estoque_baixo: 0,
    materiais_esgotados: 0
  });

  const [newMaterial, setNewMaterial] = useState({
    nome: '',
    descricao: '',
    quantidade: 0,
    unidade: 'un',
    quantidade_minima: 10,
    preco_unitario: 0,
    fornecedor: '',
    categoria: 'consumivel',
    localizacao: '',
    data_validade: '',
    lote: '',
    observacoes: ''
  });

  const [movimentacao, setMovimentacao] = useState({
    tipo: 'entrada',
    quantidade: 0,
    motivo: '',
    observacoes: ''
  });

  const categories = [
    { value: 'consumivel', label: 'Consumível' },
    { value: 'instrumental', label: 'Instrumental' },
    { value: 'medicamento', label: 'Medicamento' },
    { value: 'equipamento', label: 'Equipamento' }
  ];

  const unidades = [
    { value: 'un', label: 'Unidade' },
    { value: 'cx', label: 'Caixa' },
    { value: 'pacote', label: 'Pacote' },
    { value: 'ml', label: 'Mililitro' },
    { value: 'g', label: 'Grama' }
  ];

  useEffect(() => {
    fetchMaterials();
    fetchStats();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      let url = '/materiais?';
      if (searchTerm) url += `search=${searchTerm}&`;
      if (filterCategory) url += `categoria=${filterCategory}&`;
      if (filterLowStock) url += `estoque_baixo=true&`;
      
      const response = await api.get(url);
      setMaterials(response.data.materiais || []);
    } catch (error) {
      console.error('Erro ao carregar materiais:', error);
      showSnackbar('Erro ao carregar materiais', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/materiais/estatisticas');
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (material = null) => {
    if (material) {
      setEditingMaterial(material);
      setNewMaterial({
        nome: material.nome || '',
        descricao: material.descricao || '',
        quantidade: material.quantidade || 0,
        unidade: material.unidade || 'un',
        quantidade_minima: material.quantidade_minima || 10,
        preco_unitario: material.preco_unitario || 0,
        fornecedor: material.fornecedor || '',
        categoria: material.categoria || 'consumivel',
        localizacao: material.localizacao || '',
        data_validade: material.data_validade || '',
        lote: material.lote || '',
        observacoes: material.observacoes || ''
      });
    } else {
      setEditingMaterial(null);
      setNewMaterial({
        nome: '',
        descricao: '',
        quantidade: 0,
        unidade: 'un',
        quantidade_minima: 10,
        preco_unitario: 0,
        fornecedor: '',
        categoria: 'consumivel',
        localizacao: '',
        data_validade: '',
        lote: '',
        observacoes: ''
      });
    }
    setOpenDialog(true);
  };

  const handleOpenHistory = (material) => {
    setSelectedMaterial(material);
    setOpenHistoryDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMaterial(null);
  };

  const handleCloseHistory = () => {
    setOpenHistoryDialog(false);
    setSelectedMaterial(null);
    setMovimentacao({
      tipo: 'entrada',
      quantidade: 0,
      motivo: '',
      observacoes: ''
    });
  };

  const handleSaveMaterial = async () => {
    try {
      if (editingMaterial) {
        await api.put(`/materiais/${editingMaterial.id}`, newMaterial);
        showSnackbar('Material atualizado com sucesso');
      } else {
        await api.post('/materiais', newMaterial);
        showSnackbar('Material adicionado com sucesso');
      }
      fetchMaterials();
      fetchStats();
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar material:', error);
      showSnackbar('Erro ao salvar material', 'error');
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este material?')) {
      try {
        await api.delete(`/materiais/${id}`);
        fetchMaterials();
        fetchStats();
        showSnackbar('Material removido com sucesso');
      } catch (error) {
        console.error('Erro ao excluir material:', error);
        showSnackbar('Erro ao excluir material', 'error');
      }
    }
  };

  const handleMovimentacao = async () => {
    if (!selectedMaterial || movimentacao.quantidade <= 0) return;

    try {
      await api.post(`/materiais/${selectedMaterial.id}/movimentacoes`, movimentacao);
      showSnackbar('Movimentação registrada com sucesso');
      fetchMaterials();
      fetchStats();
      handleCloseHistory();
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
      showSnackbar('Erro ao registrar movimentação', 'error');
    }
  };

  const getStockStatusColor = (material) => {
    if (material.quantidade <= 0) return 'error';
    if (material.quantidade <= material.quantidade_minima) return 'warning';
    return 'success';
  };

  const getStockStatusLabel = (material) => {
    if (material.quantidade <= 0) return 'Esgotado';
    if (material.quantidade <= material.quantidade_minima) return 'Baixo';
    return 'Normal';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#4A5568', mb: 3 }}>
        📦 Gestão de Materiais
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total de Itens
              </Typography>
              <Typography variant="h4">
                {stats.total_materiais}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Valor em Estoque
              </Typography>
              <Typography variant="h4">
                R$ {stats.valor_total_estoque?.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#FFF3CD' }}>
            <CardContent>
              <Typography color="warning.dark" gutterBottom>
                Estoque Baixo
              </Typography>
              <Typography variant="h4" color="warning.dark">
                {stats.materiais_estoque_baixo}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#FFE0E0' }}>
            <CardContent>
              <Typography color="error" gutterBottom>
                Esgotados
              </Typography>
              <Typography variant="h4" color="error">
                {stats.materiais_esgotados}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
            <TextField
              size="small"
              placeholder="Buscar materiais..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              sx={{ width: 300 }}
            />
            <TextField
              select
              size="small"
              label="Categoria"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              sx={{ width: 200 }}
            >
              <MenuItem value="">Todas</MenuItem>
              {categories.map(cat => (
                <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
              ))}
            </TextField>
            <Button
              variant={filterLowStock ? "contained" : "outlined"}
              onClick={() => setFilterLowStock(!filterLowStock)}
              color="warning"
            >
              Estoque Baixo
            </Button>
            <Button variant="outlined" onClick={fetchMaterials}>
              Aplicar Filtros
            </Button>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Novo Material
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Material</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell align="right">Quantidade</TableCell>
                <TableCell align="right">Mínimo</TableCell>
                <TableCell align="right">Preço Unit.</TableCell>
                <TableCell align="right">Valor Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {materials.map((material) => (
                <TableRow key={material.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {material.nome}
                    </Typography>
                    {material.descricao && (
                      <Typography variant="caption" color="text.secondary">
                        {material.descricao}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {categories.find(c => c.value === material.categoria)?.label || material.categoria}
                  </TableCell>
                  <TableCell align="right">
                    {material.quantidade} {material.unidade}
                  </TableCell>
                  <TableCell align="right">
                    {material.quantidade_minima} {material.unidade}
                  </TableCell>
                  <TableCell align="right">
                    R$ {parseFloat(material.preco_unitario).toFixed(2)}
                  </TableCell>
                  <TableCell align="right">
                    R$ {material.valor_total?.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStockStatusLabel(material)}
                      color={getStockStatusColor(material)}
                      size="small"
                      icon={material.estoque_status !== 'normal' ? <WarningIcon /> : undefined}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Histórico">
                      <IconButton size="small" onClick={() => handleOpenHistory(material)}>
                        <HistoryIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleOpenDialog(material)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteMaterial(material.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {materials.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      Nenhum material encontrado
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingMaterial ? 'Editar Material' : 'Novo Material'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome do Material *"
                value={newMaterial.nome}
                onChange={(e) => setNewMaterial({ ...newMaterial, nome: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Categoria *"
                value={newMaterial.categoria}
                onChange={(e) => setNewMaterial({ ...newMaterial, categoria: e.target.value })}
              >
                {categories.map(cat => (
                  <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                multiline
                rows={2}
                value={newMaterial.descricao}
                onChange={(e) => setNewMaterial({ ...newMaterial, descricao: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Quantidade"
                type="number"
                value={newMaterial.quantidade}
                onChange={(e) => setNewMaterial({ ...newMaterial, quantidade: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Unidade"
                value={newMaterial.unidade}
                onChange={(e) => setNewMaterial({ ...newMaterial, unidade: e.target.value })}
              >
                {unidades.map(uni => (
                  <MenuItem key={uni.value} value={uni.value}>{uni.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Quantidade Mínima"
                type="number"
                value={newMaterial.quantidade_minima}
                onChange={(e) => setNewMaterial({ ...newMaterial, quantidade_minima: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Preço Unitário (R$)"
                type="number"
                value={newMaterial.preco_unitario}
                onChange={(e) => setNewMaterial({ ...newMaterial, preco_unitario: parseFloat(e.target.value) || 0 })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Fornecedor"
                value={newMaterial.fornecedor}
                onChange={(e) => setNewMaterial({ ...newMaterial, fornecedor: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Localização"
                value={newMaterial.localizacao}
                onChange={(e) => setNewMaterial({ ...newMaterial, localizacao: e.target.value })}
                placeholder="Ex: Prateleira A1"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Lote"
                value={newMaterial.lote}
                onChange={(e) => setNewMaterial({ ...newMaterial, lote: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Data de Validade"
                type="date"
                value={newMaterial.data_validade}
                onChange={(e) => setNewMaterial({ ...newMaterial, data_validade: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={2}
                value={newMaterial.observacoes}
                onChange={(e) => setNewMaterial({ ...newMaterial, observacoes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSaveMaterial} 
            variant="contained"
            disabled={!newMaterial.nome}
          >
            {editingMaterial ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openHistoryDialog} onClose={handleCloseHistory} maxWidth="sm" fullWidth>
        <DialogTitle>
          Movimentações - {selectedMaterial?.nome}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Quantidade atual: {selectedMaterial?.quantidade} {selectedMaterial?.unidade}
            </Typography>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Tipo"
                  value={movimentacao.tipo}
                  onChange={(e) => setMovimentacao({ ...movimentacao, tipo: e.target.value })}
                >
                  <MenuItem value="entrada">Entrada</MenuItem>
                  <MenuItem value="saida">Saída</MenuItem>
                  <MenuItem value="ajuste">Ajuste</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Quantidade"
                  type="number"
                  value={movimentacao.quantidade}
                  onChange={(e) => setMovimentacao({ ...movimentacao, quantidade: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Motivo"
                  value={movimentacao.motivo}
                  onChange={(e) => setMovimentacao({ ...movimentacao, motivo: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observações"
                  multiline
                  rows={2}
                  value={movimentacao.observacoes}
                  onChange={(e) => setMovimentacao({ ...movimentacao, observacoes: e.target.value })}
                />
              </Grid>
            </Grid>

            {selectedMaterial?.movimentacoes?.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Histórico Recente
                </Typography>
                {selectedMaterial.movimentacoes.map((mov, index) => (
                  <Paper key={index} sx={{ p: 1, mb: 1, bgcolor: '#f5f5f5' }}>
                    <Typography variant="body2">
                      <strong>{mov.tipo}:</strong> {mov.quantidade} {selectedMaterial.unidade}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(mov.created_at).toLocaleString()} - {mov.motivo}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistory}>Cancelar</Button>
          <Button 
            onClick={handleMovimentacao} 
            variant="contained"
            disabled={movimentacao.quantidade <= 0}
          >
            Registrar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MaterialsManagement;