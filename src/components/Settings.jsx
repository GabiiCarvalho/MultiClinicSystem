import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  IconButton,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  CircularProgress,
} from "@mui/material";

import { styled } from "@mui/material/styles";

import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import BadgeIcon from "@mui/icons-material/Badge";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DescriptionIcon from "@mui/icons-material/Description";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import RefreshIcon from "@mui/icons-material/Refresh";

/* ======================================================
   CONFIGURAÇÃO CENTRAL DE CARGOS
====================================================== */

const ROLE_CONFIG = {
  proprietario: {
    label: "👑 Proprietário",
    colors: { bg: "#9C27B0", text: "#FFFFFF" },
  },
  gestor: {
    label: "👑 Gestor",
    colors: { bg: "#A7C7E7", text: "#4A5568" },
  },
  financeiro: {
    label: "💰 Financeiro",
    colors: { bg: "#C5E0C5", text: "#4F7A4F" },
  },
  atendente: {
    label: "📋 Atendente",
    colors: { bg: "#F9D7D7", text: "#A65D5D" },
  },
  dentista: {
    label: "🦷 Dentista",
    colors: { bg: "#FFE5B4", text: "#B87C4A" },
  },
};

const getRoleLabel = (cargo) =>
  ROLE_CONFIG[cargo]?.label || cargo || "Não informado";

const getRoleColors = (cargo) =>
  ROLE_CONFIG[cargo]?.colors || ROLE_CONFIG.atendente.colors;

/* ======================================================
   ESTILIZAÇÕES
====================================================== */

const StyledCard = styled(Card)({
  borderRadius: 16,
  transition: "transform 0.2s, box-shadow 0.2s",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 12px 24px rgba(0,0,0,0.05)",
  },
});

/* ======================================================
   COMPONENTE PRINCIPAL
====================================================== */

const Settings = () => {
  const { user, clinicName } = useAuth();

  const [tabValue, setTabValue] = useState(0);
  const [colaboradores, setColaboradores] = useState([]);

  const [loadingList, setLoadingList] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    whatsapp: "",
    cpf: "",
    endereco: "",
    cargo: "atendente",
    especialidade: "",
    cro: "",
    biografia: "",
    senha: "",
  });

  /* ======================================================
     PERMISSÃO
  ====================================================== */

  const temPermissao = useMemo(() => {
    return ["gestor", "proprietario"].includes(user?.cargo);
  }, [user]);

  /* ======================================================
     CARREGAMENTO
  ====================================================== */

  const carregarColaboradores = useCallback(async () => {
    setLoadingList(true);
    try {
      const response = await api.get("/pessoas/colaboradores");
      setColaboradores(response.data);
    } catch (error) {
      showSnackbar("Erro ao carregar colaboradores", "error");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    carregarColaboradores();
  }, [carregarColaboradores]);

  /* ======================================================
     MEMOIZAÇÃO DE CONTAGENS
  ====================================================== */

  const roleCounts = useMemo(() => {
    return colaboradores.reduce((acc, c) => {
      acc[c.cargo] = (acc[c.cargo] || 0) + 1;
      return acc;
    }, {});
  }, [colaboradores]);

  const filteredColaboradores = useMemo(() => {
    if (tabValue === 0) return colaboradores;
    const roles = ["atendente", "financeiro", "dentista"];
    return colaboradores.filter((c) => c.cargo === roles[tabValue - 1]);
  }, [tabValue, colaboradores]);

  /* ======================================================
     FUNÇÕES AUXILIARES
  ====================================================== */

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      email: "",
      telefone: "",
      whatsapp: "",
      cpf: "",
      endereco: "",
      cargo: "atendente",
      especialidade: "",
      cro: "",
      biografia: "",
      senha: "",
    });
  };

  /* ======================================================
     SALVAR
  ====================================================== */

  const handleSave = async () => {
    if (!formData.nome || !formData.email || !formData.telefone) {
      return showSnackbar("Preencha os campos obrigatórios", "error");
    }

    if (!editingUser && !formData.senha) {
      return showSnackbar("Senha obrigatória para novo colaborador", "error");
    }

    if (formData.cargo === "dentista" && !formData.cro) {
      return showSnackbar("CRO obrigatório para dentista", "error");
    }

    setLoadingSave(true);

    try {
      if (editingUser) {
        await api.put(
          `/pessoas/colaboradores/${editingUser.id}`,
          formData
        );
        showSnackbar("Atualizado com sucesso");
      } else {
        await api.post("/pessoas/colaboradores", formData);
        showSnackbar("Criado com sucesso");
      }

      carregarColaboradores();
      setOpenDialog(false);
      resetForm();
    } catch (error) {
      showSnackbar("Erro ao salvar", "error");
    } finally {
      setLoadingSave(false);
    }
  };

  /* ======================================================
     DELETE
  ====================================================== */

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja remover este colaborador?")) return;

    setLoadingDelete(true);

    try {
      await api.delete(`/pessoas/colaboradores/${id}`);
      showSnackbar("Removido com sucesso");
      carregarColaboradores();
    } catch {
      showSnackbar("Erro ao remover", "error");
    } finally {
      setLoadingDelete(false);
    }
  };

  /* ======================================================
     BLOQUEIO DE ACESSO
  ====================================================== */

  if (!temPermissao) {
    return (
      <Box p={5}>
        <Typography variant="h5">
          Acesso restrito.
        </Typography>
      </Box>
    );
  }

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>
        ⚙️ Configurações - {clinicName}
      </Typography>

      <Button
        startIcon={<PersonAddIcon />}
        variant="contained"
        onClick={() => {
          setEditingUser(null);
          resetForm();
          setOpenDialog(true);
        }}
        sx={{ mb: 3 }}
      >
        Novo Colaborador
      </Button>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label={`Todos (${colaboradores.length})`} />
          <Tab label={`Atendentes (${roleCounts.atendente || 0})`} />
          <Tab label={`Financeiro (${roleCounts.financeiro || 0})`} />
          <Tab label={`Dentistas (${roleCounts.dentista || 0})`} />
        </Tabs>
      </Paper>

      {loadingList ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={2}>
          {filteredColaboradores.map((colab) => {
            const colors = getRoleColors(colab.cargo);

            return (
              <Grid item xs={12} key={colab.id}>
                <StyledCard>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between">
                      <Box display="flex" gap={2}>
                        <Avatar
                          sx={{
                            bgcolor: colors.bg,
                            color: colors.text,
                          }}
                        >
                          {colab.nome?.charAt(0)}
                        </Avatar>

                        <Box>
                          <Typography variant="h6">
                            {colab.nome}
                          </Typography>

                          <Chip
                            label={getRoleLabel(colab.cargo)}
                            size="small"
                            sx={{
                              bgcolor: colors.bg,
                              color: colors.text,
                              mt: 1,
                            }}
                          />

                          <Typography variant="body2" mt={1}>
                            {colab.email}
                          </Typography>

                          <Typography variant="body2">
                            {colab.telefone}
                          </Typography>
                        </Box>
                      </Box>

                      <Box>
                        <IconButton
                          onClick={() => {
                            setEditingUser(colab);
                            setFormData({ ...colab, senha: "" });
                            setOpenDialog(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>

                        <IconButton
                          onClick={() => handleDelete(colab.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* DIALOG */}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth>
        <DialogTitle>
          {editingUser ? "Editar" : "Novo"} Colaborador
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            label="Nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            sx={{ mt: 2 }}
          />

          <TextField
            fullWidth
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            sx={{ mt: 2 }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancelar
          </Button>

          <Button
            onClick={handleSave}
            disabled={loadingSave}
            variant="contained"
          >
            {loadingSave ? <CircularProgress size={20} /> : "Salvar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() =>
          setSnackbar({ ...snackbar, open: false })
        }
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
