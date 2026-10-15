import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { Plus, Trash2, Phone, Check, Mail, Edit2 } from 'lucide-react';

export const EmergencyContacts = ({ onNavigate }) => {
  const { emergencyContacts, addEmergencyContact, deleteEmergencyContact, editEmergencyContact } = useAuth();
  const { speak, triggerHaptic } = useAccessibility();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Voice command listener
  useEffect(() => {
    const handleVoiceCmd = (e) => {
      const { intent } = e.detail || {};
      if (intent === 'EDIT_EMERGENCY_EMAIL') {
        setIsAdding(true);
        speak('Opening add contact form. You can edit the guardian email here.', true);
      }
    };
    window.addEventListener('wellnest-voice-cmd', handleVoiceCmd);
    return () => window.removeEventListener('wellnest-voice-cmd', handleVoiceCmd);
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    triggerHaptic('medium');
    if (!name || !phone) {
      speak("Please enter name and phone number", true);
      return;
    }
    addEmergencyContact({
      name, relationship: relationship || 'Family Contact',
      phone, email: email.trim(), isPrimary: false
    });
    setName(''); setRelationship(''); setPhone(''); setEmail('');
    setIsAdding(false);
    speak(`Added ${name} to your emergency contacts.`, true);
  };

  const handleEdit = (contact) => {
    triggerHaptic();
    setEditingId(contact.id);
    setName(contact.name);
    setRelationship(contact.relationship);
    setPhone(contact.phone);
    setEmail(contact.email || '');
    speak(`Editing contact ${contact.name}. Update the details and save.`, true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    triggerHaptic('medium');
    editEmergencyContact(editingId, {
      name, relationship, phone, email: email.trim()
    });
    setEditingId(null);
    setName(''); setRelationship(''); setPhone(''); setEmail('');
    speak(`Contact updated successfully.`, true);
  };

  const handleDelete = (id, cName) => {
    triggerHaptic();
    deleteEmergencyContact(id);
    speak(`Removed ${cName} from emergency contacts.`, true);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 800 }}>
            Emergency Contacts
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            People notified via SMS & Email when SOS is triggered.
          </p>
        </div>

        <button
          onClick={() => {
            triggerHaptic();
            setIsAdding(!isAdding);
          }}
          className="btn-primary"
          style={{ padding: '0.5rem 0.875rem', fontSize: '0.9rem' }}
        >
          <Plus size={18} />
          <span>{isAdding ? 'Cancel' : 'Add New'}</span>
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleAdd} className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', border: '2px solid var(--border-active)' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700 }}>Add New Contact</h3>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Contact Name</label>
            <input type="text" className="form-input" placeholder="e.g. Sarah Johnson" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Relationship</label>
            <input type="text" className="form-input" placeholder="e.g. Sister / Guardian" value={relationship} onChange={(e) => setRelationship(e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Phone Number</label>
            <input type="tel" className="form-input" placeholder="+91 XXXXX XXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Guardian Email</label>
            <input type="email" className="form-input" placeholder="guardian@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }}>
            <Check size={18} /><span>Save Contact</span>
          </button>
        </form>
      )}

      {/* Edit Form */}
      {editingId && (
        <form onSubmit={handleSaveEdit} className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', border: '2px solid var(--accent-primary)' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-primary)', fontWeight: 700 }}>✏ Edit Contact</h3>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Contact Name</label>
            <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Relationship</label>
            <input type="text" className="form-input" value={relationship} onChange={(e) => setRelationship(e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Phone Number</label>
            <input type="tel" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Guardian Email (SOS alert jayega yahan)</label>
            <input type="email" className="form-input" placeholder="guardian@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Check size={18} /><span>Save Changes</span>
            </button>
            <button type="button" className="btn-secondary" onClick={() => setEditingId(null)} style={{ flex: 1, justifyContent: 'center' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Contacts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {emergencyContacts.map((c) => (
          <div key={c.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700 }}>{c.name}</h4>
                {c.isPrimary && <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>PRIMARY</span>}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>{c.relationship}</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>📱 {c.phone}</p>
              {c.email && (
                <p style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', marginTop: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Mail size={14} /> {c.email}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => window.location.href = `tel:${c.phone}`}
                aria-label={`Call ${c.name}`}
                className="btn-primary"
                style={{ padding: '0.5rem', borderRadius: '50%' }}
              >
                <Phone size={18} />
              </button>

              <button
                onClick={() => handleEdit(c)}
                aria-label={`Edit ${c.name}`}
                className="btn-secondary"
                style={{ padding: '0.5rem', borderRadius: '50%', color: 'var(--accent-primary)' }}
              >
                <Edit2 size={18} />
              </button>

              {!c.isPrimary && (
                <button
                  onClick={() => handleDelete(c.id, c.name)}
                  aria-label={`Delete ${c.name}`}
                  className="btn-secondary"
                  style={{ padding: '0.5rem', borderRadius: '50%', color: 'var(--danger)' }}
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
