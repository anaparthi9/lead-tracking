import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { leadAPI } from '../services/api';
import {
  LeadTemperature,
  LeadStatus,
  PreferredModel,
  RoofType,
  OwnershipStatus,
  LEAD_SOURCES,
  INDUSTRY_SECTORS,
  INDIAN_STATES,
} from '../types';

export default function LeadForm() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    company_name: '',
    gstin: '',
    website_url: '',
    address_full: '',
    city: '',
    state: '',
    pin_code: '',
    industry_sector: '',
    sanctioned_load_kva: '',
    monthly_consumption_kwh: '',
    current_tariff_per_kwh: '',
    has_solar: false,
    solar_capacity_kw: '',
    has_battery: false,
    battery_capacity_kwh: '',
    has_dg: false,
    dg_capacity_kva: '',
    roof_type: '',
    available_area_sqft: '',
    ownership_status: '',
    lease_remaining_years: '',
    lead_source: '',
    lead_source_detail: '',
    deal_size_estimate: '',
    preferred_model: '',
    temperature: LeadTemperature.COLD,
  });

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.company_name.trim()) {
      setError('Company name is required');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const leadData = {
        company_name: formData.company_name,
        gstin: formData.gstin || undefined,
        website_url: formData.website_url || undefined,
        address_full: formData.address_full || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        pin_code: formData.pin_code || undefined,
        industry_sector: formData.industry_sector || undefined,
        sanctioned_load_kva: formData.sanctioned_load_kva ? parseFloat(formData.sanctioned_load_kva) : undefined,
        monthly_consumption_kwh: formData.monthly_consumption_kwh ? parseFloat(formData.monthly_consumption_kwh) : undefined,
        current_tariff_per_kwh: formData.current_tariff_per_kwh ? parseFloat(formData.current_tariff_per_kwh) : undefined,
        has_solar: formData.has_solar,
        solar_capacity_kw: formData.solar_capacity_kw ? parseFloat(formData.solar_capacity_kw) : undefined,
        has_battery: formData.has_battery,
        battery_capacity_kwh: formData.battery_capacity_kwh ? parseFloat(formData.battery_capacity_kwh) : undefined,
        has_dg: formData.has_dg,
        dg_capacity_kva: formData.dg_capacity_kva ? parseFloat(formData.dg_capacity_kva) : undefined,
        roof_type: formData.roof_type as RoofType || undefined,
        available_area_sqft: formData.available_area_sqft ? parseFloat(formData.available_area_sqft) : undefined,
        ownership_status: formData.ownership_status as OwnershipStatus || undefined,
        lease_remaining_years: formData.lease_remaining_years ? parseInt(formData.lease_remaining_years) : undefined,
        lead_source: formData.lead_source || undefined,
        lead_source_detail: formData.lead_source_detail || undefined,
        deal_size_estimate: formData.deal_size_estimate ? parseFloat(formData.deal_size_estimate) : undefined,
        preferred_model: formData.preferred_model as PreferredModel || undefined,
        temperature: formData.temperature as LeadTemperature,
        lead_status: LeadStatus.NEW,
      };

      const newLead = await leadAPI.create(leadData);
      navigate(`/leads/${newLead.id}`);
    } catch (err: any) {
      console.error('Failed to create lead:', err);
      setError(err.message || 'Failed to create lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/leads')}
          sx={{ color: 'text.secondary' }}
        >
          Back to Leads
        </Button>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Add New Lead
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <form onSubmit={handleSubmit}>
          {/* Company Information */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Company Information
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Name"
                required
                value={formData.company_name}
                onChange={handleChange('company_name')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="GSTIN"
                value={formData.gstin}
                onChange={handleChange('gstin')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Industry Sector"
                value={formData.industry_sector}
                onChange={handleChange('industry_sector')}
              >
                {INDUSTRY_SECTORS.map(sector => (
                  <MenuItem key={sector} value={sector}>{sector}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Website"
                value={formData.website_url}
                onChange={handleChange('website_url')}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Address */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Address
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Address"
                multiline
                rows={2}
                value={formData.address_full}
                onChange={handleChange('address_full')}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={handleChange('city')}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="State"
                value={formData.state}
                onChange={handleChange('state')}
              >
                {INDIAN_STATES.map(state => (
                  <MenuItem key={state} value={state}>{state}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="PIN Code"
                value={formData.pin_code}
                onChange={handleChange('pin_code')}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Energy Details */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Energy Details
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Sanctioned Load (kVA)"
                type="number"
                value={formData.sanctioned_load_kva}
                onChange={handleChange('sanctioned_load_kva')}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Monthly Consumption (kWh)"
                type="number"
                value={formData.monthly_consumption_kwh}
                onChange={handleChange('monthly_consumption_kwh')}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Current Tariff (₹/kWh)"
                type="number"
                value={formData.current_tariff_per_kwh}
                onChange={handleChange('current_tariff_per_kwh')}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Site Details */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Site Details
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Roof Type"
                value={formData.roof_type}
                onChange={handleChange('roof_type')}
              >
                <MenuItem value="RCC">RCC</MenuItem>
                <MenuItem value="Metal sheet">Metal Sheet</MenuItem>
                <MenuItem value="Ground mount">Ground Mount</MenuItem>
                <MenuItem value="Mixed">Mixed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Available Area (sq ft)"
                type="number"
                value={formData.available_area_sqft}
                onChange={handleChange('available_area_sqft')}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Ownership Status"
                value={formData.ownership_status}
                onChange={handleChange('ownership_status')}
              >
                <MenuItem value="Owned">Owned</MenuItem>
                <MenuItem value="Leased">Leased</MenuItem>
                <MenuItem value="Rented">Rented</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Sales Information */}
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Sales Information
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Lead Source"
                value={formData.lead_source}
                onChange={handleChange('lead_source')}
              >
                {LEAD_SOURCES.map(source => (
                  <MenuItem key={source} value={source}>{source}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Temperature"
                value={formData.temperature}
                onChange={handleChange('temperature')}
              >
                <MenuItem value={LeadTemperature.COLD}>Cold</MenuItem>
                <MenuItem value={LeadTemperature.WARM}>Warm</MenuItem>
                <MenuItem value={LeadTemperature.HOT}>Hot</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Preferred Model"
                value={formData.preferred_model}
                onChange={handleChange('preferred_model')}
              >
                <MenuItem value="CAPEX">CAPEX</MenuItem>
                <MenuItem value="OPEX">OPEX</MenuItem>
                <MenuItem value="Sale-Leaseback">Sale-Leaseback</MenuItem>
                <MenuItem value="Undecided">Undecided</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Deal Size Estimate (₹)"
                type="number"
                value={formData.deal_size_estimate}
                onChange={handleChange('deal_size_estimate')}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/leads')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Create Lead'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
