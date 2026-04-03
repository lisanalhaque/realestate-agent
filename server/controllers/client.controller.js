const Client = require('../models/Client');

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
const getClients = async (req, res) => {
  try {
    const filter = req.user.role === 'agent' ? { assignedAgent: req.user._id } : {};
    const clients = await Client.find(filter).populate('assignedAgent', 'name');
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create client
// @route   POST /api/clients
// @access  Private
const createClient = async (req, res) => {
  try {
    const { name, phone, email, type, budget, requirements } = req.body;
    
    const client = await Client.create({
      name, phone, email, type, budget, requirements,
      assignedAgent: req.user._id
    });

    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).populate('assignedAgent', 'name');
    if (!client) return res.status(404).json({ message: 'Client not found' });
    
    if (req.user.role === 'agent' && client.assignedAgent._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this client' });
    }
    
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
const updateClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    if (req.user.role === 'agent' && client.assignedAgent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this client' });
    }

    const updatedClient = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedClient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private
const deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    if (req.user.role === 'agent' && client.assignedAgent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this client' });
    }

    await client.deleteOne();
    res.json({ message: 'Client removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getClients, createClient, getClientById, updateClient, deleteClient };
