import { useState, useContext, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Grid, MenuItem,
  Alert, Snackbar, Avatar, Chip, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, InputAdornment, Divider,
} from '@mui/material';
import {
  Settings as SettingsIcon, PersonAdd, Delete, Edit,
  Business, Save, Visibility, VisibilityOff, Refresh, Person,
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api'; // ← axios já tem o Bearer configurado

// ─── Cargos válidos — espelho exato do backend cargosValidos[] ─────────────
const CARGOS = [
  { value: 'atendente',   label: 'Atendente'   },
  { value: 'financeiro',  label: 'Financeiro'  },
  { value: 'dentista',    label: 'Dentista'    },
  { value: 'esteticista', label: 'Esteticista' },
  { value: 'Gestor',      label: 'Gestor'      }, // 'G' maiúsculo igual ao backend
];

const ESPECIALIDADES = {
  dentista:    ['Clínico Geral','Ortodontia','Endodontia','Periodontia','Implantodontia','Odontopediatria','Cirurgia','Prótese'],
  esteticista: ['Harmonização Facial','Clareamento','Limpeza','Botox'],
};

const CARGO_COLORS = {
  proprietario: '#7C3AED',
  Gestor:       '#2563EB',
  gestor:       '#2563EB',
  dentista:     '#059669',
  esteticista:  '#EC4899',
  atendente:    '#D97706',
  financeiro:   '#0891B2',
};

// api já injeta Authorization: Bearer <token> em toda requisição
const apiFetch = async (method, path, body) => {
  const res = await api({ method, url: path, data: body });
  return res.data;
};

const emptyForm = () => ({ nome: '', email: '', senha: '', confirmarSenha: '', cargo: '', especialidade: '' });

// ══════════════════════════════════════════════════════════════════════════
const Settings = () => {
  const { user, clinicName } = useContext(AuthContext);

  // Lista
  const [usuarios, setUsuarios]       = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Formulário novo usuário
  const [form, setForm]               = useState(emptyForm());
  const [touched, setTouched]         = useState({});
  const [showSenha, setShowSenha]     = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  // Edição
  const [editDialog, setEditDialog]   = useState(null);
  const [editForm, setEditForm]       = useState({});
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Clínica
  const [clinicForm, setClinicForm]   = useState({ nome: clinicName || '', telefone: '', endereco: '' });

  // Feedback
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const show = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  // ── GET /usuarios ao montar ──────────────────────────────────────────
  useEffect(() => { fetchUsuarios(); }, []);

  const fetchUsuarios = async () => {
    setLoadingList(true);
    try {
      const data = await apiFetch('GET', '/usuarios');
      setUsuarios(data);
    } catch (err) {
      show(err.response?.data?.error || err.message, 'error');
    } finally {
      setLoadingList(false);
    }
  };

  // ── Validações ───────────────────────────────────────────────────────
  const set   = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const touch = (k)    => setTouched(t => ({ ...t, [k]: true }));

  const errors = {
    nome:           !form.nome.trim()                           ? 'Obrigatório' : '',
    email:          !form.email.trim()                          ? 'Obrigatório'
                  : !/^[^@]+@[^@]+\.[^@]+$/.test(form.email)   ? 'E-mail inválido' : '',
    senha:          form.senha.length < 6                       ? 'Mínimo 6 caracteres' : '',
    confirmarSenha: form.confirmarSenha !== form.senha          ? 'Senhas não coincidem' : '',
    cargo:          !form.cargo                                 ? 'Obrigatório' : '',
  };
  const formValid = Object.values(errors).every(e => !e);

  // ── POST /usuarios ───────────────────────────────────────────────────
  const handleAddUser = async (e) => {
    e.preventDefault();
    setTouched({ nome:true, email:true, senha:true, confirmarSenha:true, cargo:true });
    if (!formValid) return;

    setLoadingSave(true);
    try {
      const body = {
        nome:  form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        senha: form.senha,
        cargo: form.cargo,
        ...(form.especialidade ? { especialidade: form.especialidade } : {}),
      };
      const created = await apiFetch('POST', '/usuarios', body);
      show(`${created.nome} cadastrado com sucesso!`);
      setForm(emptyForm());
      setTouched({});
      fetchUsuarios(); // atualiza a tabela
    } catch (err) {
      show(err.response?.data?.error || err.message, 'error'); // 409 e-mail duplicado | 400 cargo inválido
    } finally {
      setLoadingSave(false);
    }
  };

  // ── PATCH /usuarios/:id ──────────────────────────────────────────────
  const handleEditar = async () => {
    setLoadingEdit(true);
    try {
      const body = {};
      if (editForm.nome)                    body.nome         = editForm.nome;
      if (editForm.cargo)                   body.cargo        = editForm.cargo;
      if (editForm.especialidade !== undefined) body.especialidade = editForm.especialidade;
      if (editForm.ativo !== undefined)     body.ativo        = editForm.ativo;
      if (editForm.senha)                   body.senha        = editForm.senha;

      await apiFetch('PATCH', `/usuarios/${editDialog.id}`, body);
      show('Usuário atualizado!');
      setEditDialog(null);
      fetchUsuarios();
    } catch (err) {
      show(err.response?.data?.error || err.message, 'error');
    } finally {
      setLoadingEdit(false);
    }
  };

  // ── DELETE /usuarios/:id (soft delete) ──────────────────────────────
  const handleDesativar = async (id, nome) => {
    if (!window.confirm(`Desativar "${nome}"?`)) return;
    try {
      await apiFetch('DELETE', `/usuarios/${id}`);
      show(`${nome} desativado.`);
      fetchUsuarios();
    } catch (err) {
      show(err.response?.data?.error || err.message, 'error');
    }
  };

  const temEspecialidade = (cargo) => !!ESPECIALIDADES[cargo]?.length;

  // ════════════════════════ RENDER ═════════════════════════════════════
  return (
    <Box>
      {/* Título */}
      <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:3 }}>
        <SettingsIcon sx={{ color:'primary.main', fontSize:28 }} />
        <Typography variant="h5" fontWeight={700}>Configurações</Typography>
      </Box>

      <Grid container spacing={3}>

        {/* ── Info da Clínica ── */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:3, borderRadius:3, height:'100%' }}>
            <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:2.5 }}>
              <Business sx={{ color:'primary.main' }} />
              <Typography variant="h6" fontWeight={700}>Informações da Clínica</Typography>
            </Box>

            <Box sx={{ mb:3, p:2, bgcolor:'#F8FAFC', borderRadius:2 }}>
              <Typography variant="body2" color="text.secondary">Clínica</Typography>
              <Typography variant="h6" fontWeight={700}>{clinicName || '—'}</Typography>
              <Typography variant="caption" color="text.secondary">
                clinica_id: {user?.clinica_id || '—'}
              </Typography>
            </Box>

            <Box sx={{ display:'flex', flexDirection:'column', gap:2 }}>
              <TextField fullWidth label="Nome da Clínica"
                value={clinicForm.nome}
                onChange={e => setClinicForm(f => ({ ...f, nome: e.target.value }))} />
              <TextField fullWidth label="Telefone"
                value={clinicForm.telefone}
                onChange={e => setClinicForm(f => ({ ...f, telefone: e.target.value }))}
                placeholder="(47) 99641-2384" />
              <TextField fullWidth label="Endereço"
                value={clinicForm.endereco}
                onChange={e => setClinicForm(f => ({ ...f, endereco: e.target.value }))}
                placeholder="Rua, número, cidade" />
              <Button variant="contained" startIcon={<Save />}
                onClick={() => show('Em breve disponível')}>
                Salvar Alterações
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* ── Meu Perfil ── */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:3, borderRadius:3, height:'100%' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb:2.5 }}>Meu Perfil</Typography>

            <Box sx={{ display:'flex', alignItems:'center', gap:2, mb:3, p:2, bgcolor:'#F8FAFC', borderRadius:2 }}>
              <Avatar sx={{
                width:52, height:52, fontWeight:700, fontSize:'1.2rem',
                bgcolor: CARGO_COLORS[user?.cargo] || 'primary.main',
              }}>
                {user?.nome?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="body1" fontWeight={700}>{user?.nome}</Typography>
                <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
                <Chip
                  label={user?.cargo}
                  size="small"
                  sx={{
                    mt:0.5,
                    bgcolor:`${CARGO_COLORS[user?.cargo]}18`,
                    color: CARGO_COLORS[user?.cargo],
                    fontWeight:700,
                  }}
                />
              </Box>
            </Box>

            <Alert severity="info" sx={{ borderRadius:2, fontSize:'0.8rem' }}>
              Para alterar senha ou e-mail, entre em contato com o administrador da clínica.
            </Alert>
          </Paper>
        </Grid>

        {/* ── Formulário — Adicionar Colaborador ── */}
        <Grid item xs={12}>
          <Paper sx={{ p:3, borderRadius:3 }}>
            <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:2.5 }}>
              <PersonAdd sx={{ color:'primary.main' }} />
              <Typography variant="h6" fontWeight={700}>Adicionar Colaborador</Typography>
            </Box>

            <Box component="form" onSubmit={handleAddUser} noValidate>
              <Grid container spacing={2} alignItems="flex-start">

                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth label="Nome *" value={form.nome}
                    onChange={e => set('nome', e.target.value)}
                    onBlur={() => touch('nome')}
                    error={!!(touched.nome && errors.nome)}
                    helperText={touched.nome && errors.nome} />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth label="E-mail *" type="email" value={form.email}
                    onChange={e => set('email', e.target.value)}
                    onBlur={() => touch('email')}
                    error={!!(touched.email && errors.email)}
                    helperText={touched.email && errors.email} />
                </Grid>

                {/* Cargo */}
                <Grid item xs={12} sm={6} md={2}>
                  <TextField select fullWidth label="Cargo *" value={form.cargo}
                    onChange={e => { set('cargo', e.target.value); set('especialidade', ''); }}
                    onBlur={() => touch('cargo')}
                    error={!!(touched.cargo && errors.cargo)}
                    helperText={touched.cargo && errors.cargo}>
                    {CARGOS.map(c => (
                      <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Especialidade — só para dentista/esteticista */}
                {temEspecialidade(form.cargo) && (
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField select fullWidth label="Especialidade" value={form.especialidade}
                      onChange={e => set('especialidade', e.target.value)}>
                      <MenuItem value="">Nenhuma</MenuItem>
                      {ESPECIALIDADES[form.cargo].map(e => (
                        <MenuItem key={e} value={e}>{e}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                )}

                {/* Senha */}
                <Grid item xs={12} sm={6} md={2}>
                  <TextField fullWidth label="Senha *" value={form.senha}
                    type={showSenha ? 'text' : 'password'}
                    onChange={e => set('senha', e.target.value)}
                    onBlur={() => touch('senha')}
                    error={!!(touched.senha && errors.senha)}
                    helperText={touched.senha && errors.senha}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowSenha(v => !v)} edge="end">
                            {showSenha ? <VisibilityOff fontSize="small"/> : <Visibility fontSize="small"/>}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }} />
                </Grid>

                {/* Confirmar senha */}
                <Grid item xs={12} sm={6} md={2}>
                  <TextField fullWidth label="Confirmar senha *" value={form.confirmarSenha}
                    type="password"
                    onChange={e => set('confirmarSenha', e.target.value)}
                    onBlur={() => touch('confirmarSenha')}
                    error={!!(touched.confirmarSenha && errors.confirmarSenha)}
                    helperText={touched.confirmarSenha && errors.confirmarSenha} />
                </Grid>

                <Grid item xs={12} md={2}>
                  <Button type="submit" fullWidth variant="contained"
                    disabled={loadingSave} sx={{ height:56 }}
                    startIcon={loadingSave
                      ? <CircularProgress size={16} color="inherit"/>
                      : <PersonAdd/>}>
                    {loadingSave ? 'Salvando…' : 'Adicionar'}
                  </Button>
                </Grid>

              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* ── Tabela de usuários ── */}
        <Grid item xs={12}>
          <Paper sx={{ p:3, borderRadius:3 }}>
            <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:2 }}>
              <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                <Person sx={{ color:'primary.main' }} />
                <Typography variant="h6" fontWeight={700}>Equipe da Clínica</Typography>
                <Chip label={usuarios.length} size="small" sx={{ ml:0.5 }}/>
              </Box>
              <Tooltip title="Atualizar lista">
                <IconButton onClick={fetchUsuarios} disabled={loadingList}>
                  {loadingList ? <CircularProgress size={18}/> : <Refresh/>}
                </IconButton>
              </Tooltip>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th':{ fontWeight:700, bgcolor:'#F8FAFC' } }}>
                    <TableCell>Nome</TableCell>
                    <TableCell>E-mail</TableCell>
                    <TableCell>Cargo</TableCell>
                    <TableCell>Especialidade</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingList && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py:4 }}>
                        <CircularProgress size={28}/>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loadingList && usuarios.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py:4, color:'text.secondary' }}>
                        Nenhum colaborador cadastrado
                      </TableCell>
                    </TableRow>
                  )}
                  {usuarios.map(u => (
                    <TableRow key={u.id} hover sx={{ opacity: u.ativo ? 1 : 0.45 }}>
                      <TableCell>
                        <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                          <Avatar sx={{
                            width:30, height:30, fontSize:12,
                            bgcolor: CARGO_COLORS[u.cargo] || '#64748B',
                          }}>
                            {u.nome?.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>{u.nome}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={u.cargo} size="small" sx={{
                          bgcolor:`${CARGO_COLORS[u.cargo] || '#64748B'}18`,
                          color: CARGO_COLORS[u.cargo] || '#64748B',
                          fontWeight:700, fontSize:11,
                        }}/>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {u.especialidade || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.ativo ? 'Ativo' : 'Inativo'}
                          size="small"
                          color={u.ativo ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => {
                            setEditDialog(u);
                            setEditForm({ nome:u.nome, cargo:u.cargo, especialidade:u.especialidade||'', ativo:u.ativo, senha:'' });
                          }}>
                            <Edit fontSize="small"/>
                          </IconButton>
                        </Tooltip>
                        {u.ativo && (
                          <Tooltip title="Desativar">
                            <IconButton size="small" color="error"
                              onClick={() => handleDesativar(u.id, u.nome)}>
                              <Delete fontSize="small"/>
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

      </Grid>

      {/* ── Dialog — Editar ── */}
      <Dialog open={!!editDialog} onClose={() => setEditDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight:700 }}>Editar — {editDialog?.nome}</DialogTitle>
        <DialogContent>
          <Box sx={{ display:'flex', flexDirection:'column', gap:2, pt:1 }}>
            <TextField fullWidth label="Nome"
              value={editForm.nome || ''}
              onChange={e => setEditForm(f => ({ ...f, nome:e.target.value }))} />

            <TextField select fullWidth label="Cargo"
              value={editForm.cargo || ''}
              onChange={e => setEditForm(f => ({ ...f, cargo:e.target.value, especialidade:'' }))}>
              {CARGOS.map(c => (
                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
              ))}
            </TextField>

            {temEspecialidade(editForm.cargo) && (
              <TextField select fullWidth label="Especialidade"
                value={editForm.especialidade || ''}
                onChange={e => setEditForm(f => ({ ...f, especialidade:e.target.value }))}>
                <MenuItem value="">Nenhuma</MenuItem>
                {ESPECIALIDADES[editForm.cargo]?.map(e => (
                  <MenuItem key={e} value={e}>{e}</MenuItem>
                ))}
              </TextField>
            )}

            <TextField select fullWidth label="Status"
              value={editForm.ativo === false ? 'false' : 'true'}
              onChange={e => setEditForm(f => ({ ...f, ativo: e.target.value === 'true' }))}>
              <MenuItem value="true">Ativo</MenuItem>
              <MenuItem value="false">Inativo</MenuItem>
            </TextField>

            <Divider/>

            <TextField fullWidth label="Nova senha (opcional)" type="password"
              value={editForm.senha || ''}
              onChange={e => setEditForm(f => ({ ...f, senha:e.target.value }))}
              helperText="Deixe em branco para não alterar" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px:3, pb:2 }}>
          <Button onClick={() => setEditDialog(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleEditar} disabled={loadingEdit}
            startIcon={loadingEdit ? <CircularProgress size={14} color="inherit"/> : null}>
            {loadingEdit ? 'Salvando…' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar open={snack.open} autoHideDuration={4000}
        onClose={() => setSnack(s => ({ ...s, open:false }))}
        anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius:2 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;