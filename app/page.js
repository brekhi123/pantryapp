'use client';
import { Box, Stack, Typography, Button, Modal, TextField, IconButton, List, ListItem, ListItemText, Snackbar, Alert, InputAdornment } from "@mui/material";
import { firestore } from "@/firebase";
import { collection, doc, getDocs, setDoc, query, deleteDoc, getDoc } from "firebase/firestore";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { useEffect, useState } from "react";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  borderRadius: '8px',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const itemStyles = {
  border: '1px solid #00796b',
  borderRadius: '8px',
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
  padding: 2,
  marginBottom: 1,
  transition: 'transform 0.2s, background-color 0.2s',
  '&:hover': {
    transform: 'scale(1.03)',
    backgroundColor: '#e0f2f1',
  },
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const buttonStyles = {
  borderRadius: '8px',
  '&:hover': {
    backgroundColor: '#004d40',
  },
};

export default function Home() {
  const [pantry, setPantry] = useState([]);
  const [filteredPantry, setFilteredPantry] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const handleOpen = (item = null) => {
    if (item) {
      const itemToEdit = pantry.find(({ name }) => name === item);
      if (itemToEdit) {
        setEditingItem(itemToEdit.name);
        setItemName(itemToEdit.name);
        setItemQuantity(itemToEdit.count.toString());
      }
    } else {
      setItemName('');
      setItemQuantity('');
      setEditingItem(null);
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSnackbarClose = () => setSnackbarOpen(false);

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const updatePantry = async () => {
    try {
      const snapshot = query(collection(firestore, 'pantry'));
      const docs = await getDocs(snapshot);
      const pantryList = [];
      docs.forEach((doc) => {
        pantryList.push({ name: doc.id, ...doc.data() });
      });
      setPantry(pantryList);
      setFilteredPantry(pantryList);
    } catch (error) {
      showSnackbar('Failed to update pantry', 'error');
    }
  };

  useEffect(() => {
    updatePantry();
  }, []);

  useEffect(() => {
    const filtered = pantry.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    setFilteredPantry(filtered);
  }, [searchQuery, pantry]);

  const validateFields = () => {
    if (!itemName.trim()) {
      showSnackbar('Item name cannot be blank', 'warning');
      return false;
    }
    if (!itemQuantity.trim() || isNaN(itemQuantity) || parseInt(itemQuantity, 10) <= 0) {
      showSnackbar('Quantity must be a positive number', 'warning');
      return false;
    }
    return true;
  };

  const addItem = async () => {
    if (!validateFields()) return;

    try {
      const docRef = doc(collection(firestore, 'pantry'), itemName);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const { count } = docSnap.data();
        await setDoc(docRef, { count: (count || 0) + parseInt(itemQuantity, 10) });
      } else {
        await setDoc(docRef, { count: parseInt(itemQuantity, 10) || 1 });
      }
      await updatePantry();
      showSnackbar('Item added successfully', 'success');
      handleClose(); // Close modal after adding item
    } catch (error) {
      showSnackbar('Failed to add item', 'error');
    }
  };

  const removeItem = async (item) => {
    try {
      const docRef = doc(collection(firestore, 'pantry'), item);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const { count } = docSnap.data();
        if (count === 1) {
          await deleteDoc(docRef);
        } else {
          await setDoc(docRef, { count: count - 1 });
        }
        await updatePantry();
        showSnackbar('Item removed successfully', 'success');
      }
    } catch (error) {
      showSnackbar('Failed to remove item', 'error');
    }
  };

  const saveEdit = async () => {
    if (!validateFields()) return;

    try {
      if (editingItem) {
        if (itemName !== editingItem) {
          const newDocRef = doc(collection(firestore, 'pantry'), itemName);
          const newDocSnap = await getDoc(newDocRef);
          if (newDocSnap.exists()) {
            const { count } = newDocSnap.data();
            const oldDocRef = doc(collection(firestore, 'pantry'), editingItem);
            const oldDocSnap = await getDoc(oldDocRef);
            if (oldDocSnap.exists()) {
              const { count: oldCount } = oldDocSnap.data();
              await setDoc(newDocRef, { count: count + oldCount });
              await deleteDoc(oldDocRef);
            }
          } else {
            const oldDocRef = doc(collection(firestore, 'pantry'), editingItem);
            await setDoc(newDocRef, { count: parseInt(itemQuantity, 10) || 1 });
            await deleteDoc(oldDocRef);
          }
        } else {
          const docRef = doc(collection(firestore, 'pantry'), editingItem);
          await setDoc(docRef, { count: parseInt(itemQuantity, 10) || 1 });
        }
        await updatePantry();
        showSnackbar('Item updated successfully', 'success');
      }
    } catch (error) {
      showSnackbar('Failed to update item', 'error');
    }
    handleClose(); // Close modal after saving edits
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      width="100vw"
      bgcolor="#e0f7fa"
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        flexGrow={1}
        padding={3}
      >
        <Box
          width="100%"
          maxWidth="900px"
          borderRadius="16px"
          boxShadow={8}
          overflow="hidden"
          bgcolor="#ffffff"
        >
          <Box
            height="80px"
            bgcolor="#004d40"
            display="flex"
            justifyContent="center"
            alignItems="center"
            borderBottom="4px solid #00332d"
            padding={2}
          >
            <Typography
              variant="h3"
              color="#ffffff"
              textAlign="center"
              fontWeight={700}
              sx={{
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              Pantry Management
            </Typography>
          </Box>
          <Box
            position="sticky"
            top={0}
            bgcolor="#ffffff"
            zIndex={1}
            padding={2}
            borderBottom="1px solid #b2dfdb"
            boxShadow="0 4px 6px rgba(0,0,0,0.1)"
          >
            <TextField
              label="Search Pantry"
              variant="outlined"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                borderRadius: '8px',
                marginRight: 2
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Box>
          <Stack spacing={2} padding={3} height="500px" overflow="auto">
            <List>
              {filteredPantry.map(({ name, count }) => (
                <ListItem
                  key={name}
                  sx={itemStyles}
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => handleOpen(name)}
                        sx={{ color: '#00796b' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => removeItem(name)}
                        sx={{ color: '#d32f2f' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={name.charAt(0).toUpperCase() + name.slice(1)}
                    secondary={`Quantity: ${count}`}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
              ))}
            </List>
          </Stack>
          <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box sx={modalStyle}>
              <Typography id="modal-modal-title" variant="h6" component="h2">
                {editingItem ? 'Edit Item' : 'Add Item'}
              </Typography>
              <Stack width="100%" spacing={2}>
                <TextField
                  id="item-name"
                  label={editingItem ? 'Item Name' : 'New Item Name'}
                  variant="outlined"
                  fullWidth
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
                <TextField
                  id="item-quantity"
                  label="Quantity"
                  variant="outlined"
                  type="number"
                  fullWidth
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    if (editingItem) {
                      saveEdit();
                    } else {
                      addItem();
                    }
                  }}
                  sx={buttonStyles}
                >
                  {editingItem ? 'Save Changes' : 'Add Item'}
                </Button>
              </Stack>
            </Box>
          </Modal>
          <Box padding={2} display="flex" justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpen()}
              sx={buttonStyles}
            >
              Add New Item
            </Button>
          </Box>
        </Box>
      </Box>
      <Box
        width="100%"
        height="60px"
        bgcolor="#004d40"
        display="flex"
        justifyContent="center"
        alignItems="center"
        borderTop="4px solid #00332d"
      >
        <Typography
          variant="body1"
          color="#ffffff"
          textAlign="center"
        >
          © 2024 PantryApp. All rights reserved.
        </Typography>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
