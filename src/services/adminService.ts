import { supabase } from '../utils/supabase';

export const adminService = {
  async listUsers() {
    const { data, error } = await supabase.functions.invoke('admin-proxy', {
      body: { action: 'listUsers' },
    });
    if (error) {
      console.error('Edge Function Error:', error);
      throw new Error(`Erro ao listar usuários: ${error.message}`);
    }
    return data;
  },

  async createUser(params: any) {
    const { data, error } = await supabase.functions.invoke('admin-proxy', {
      body: { action: 'createUser', params },
    });
    if (error) {
      console.error('Edge Function Error:', error);
      throw new Error(`Erro ao criar usuário: ${error.message}`);
    }
    return data;
  },

  async deleteUser(id: string) {
    const { data, error } = await supabase.functions.invoke('admin-proxy', {
      body: { action: 'deleteUser', params: { id } },
    });
    
    if (error) {
      console.error('Edge Function Error:', error);
      throw new Error(`Erro na função de admin: ${error.message || 'Verifique se os Secrets (ADMIN_EMAIL) foram configurados no Supabase'}`);
    }
    return data;
  },

  async updateUserStatus(email: string, status: 'active' | 'inactive') {
    const { data, error } = await supabase.functions.invoke('admin-proxy', {
      body: { action: 'updateUserStatus', params: { email, status } },
    });
    if (error) {
      console.error('Edge Function Error:', error);
      throw new Error(`Erro ao atualizar status: ${error.message}`);
    }
    return data;
  },

  // Helper to access the public client if needed for other tables
  supabase
};
