import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Template, TemplateId, CreateTemplateDto, UpdateTemplateDto } from '../types';
import * as api from '../api/client';
import { getErrorMessage, hasResponseStatus } from '../utils/getErrorMessage';

export interface UseAdminTemplatesReturn {
  templates: Template[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  fetchTemplates: () => Promise<void>;
  create: (dto: CreateTemplateDto) => Promise<Template | null>;
  update: (id: TemplateId, dto: UpdateTemplateDto) => Promise<Template | null>;
  remove: (id: TemplateId) => Promise<boolean>;
}

export function useAdminTemplates(): UseAdminTemplatesReturn {
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await api.getTemplates();
      setTemplates(data);
    } catch (err) {
      setError(getErrorMessage(err, tRef.current('errors.fetchTemplates'), tRef.current('errors.corsOrNetwork')));
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (dto: CreateTemplateDto): Promise<Template | null> => {
    setError(null);
    try {
      const created = await api.createTemplate(dto);
      setTemplates((prev) => [...prev, created]);
      return created;
    } catch (err) {
      if (hasResponseStatus(err) && err.response.status === 409) {
        setError(tRef.current('templates.duplicateName'));
      } else {
        setError(getErrorMessage(err, tRef.current('errors.createTemplate'), tRef.current('errors.corsOrNetwork')));
      }
      return null;
    }
  }, []);

  const update = useCallback(async (id: TemplateId, dto: UpdateTemplateDto): Promise<Template | null> => {
    setError(null);
    try {
      const updated = await api.updateTemplate(id, dto);
      setTemplates((prev) => prev.map((t) => (t._id === id ? updated : t)));
      return updated;
    } catch (err) {
      if (hasResponseStatus(err) && err.response.status === 409) {
        setError(tRef.current('templates.duplicateName'));
      } else {
        setError(getErrorMessage(err, tRef.current('errors.updateTemplate'), tRef.current('errors.corsOrNetwork')));
      }
      return null;
    }
  }, []);

  const remove = useCallback(async (id: TemplateId): Promise<boolean> => {
    setError(null);
    try {
      await api.deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t._id !== id));
      return true;
    } catch (err) {
      setError(getErrorMessage(err, tRef.current('errors.deleteTemplate'), tRef.current('errors.corsOrNetwork')));
      return false;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { templates, loading, error, clearError, fetchTemplates, create, update, remove };
}
