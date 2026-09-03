import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Customer } from '../../types';
import { customerService } from '../../services/customerService';
import { useToast } from '../../context/ToastContext';

const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  whatsappNumber: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerToEdit?: Customer | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customerToEdit,
}) => {
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      whatsappNumber: '',
      email: '',
      address: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (customerToEdit) {
      reset({
        name: customerToEdit.name,
        phoneNumber: customerToEdit.phoneNumber,
        whatsappNumber: customerToEdit.whatsappNumber,
        email: customerToEdit.email || '',
        address: customerToEdit.address || '',
        notes: customerToEdit.notes || '',
      });
    } else {
      reset({
        name: '',
        phoneNumber: '',
        whatsappNumber: '',
        email: '',
        address: '',
        notes: '',
      });
    }
  }, [customerToEdit, reset, isOpen]);

  const onSubmit = async (data: CustomerFormData) => {
    try {
      const payload = {
        ...data,
        whatsappNumber: data.whatsappNumber || data.phoneNumber,
      };

      if (customerToEdit) {
        await customerService.updateCustomer(customerToEdit._id, payload);
        showToast('success', 'Customer Updated', `${data.name} has been updated.`);
      } else {
        await customerService.createCustomer(payload);
        showToast('success', 'Customer Created', `${data.name} has been added.`);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Operation failed';
      showToast('error', 'Failed', msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customerToEdit ? 'Edit Customer' : 'Add New Customer'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Customer Name *"
          placeholder="e.g. Rajesh Kumar"
          {...register('name')}
          error={errors.name?.message}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone Number *"
            placeholder="e.g. 9876543210"
            {...register('phoneNumber')}
            error={errors.phoneNumber?.message}
          />
          <Input
            label="WhatsApp Number"
            placeholder="Defaults to phone"
            {...register('whatsappNumber')}
            error={errors.whatsappNumber?.message}
          />
        </div>

        <Input
          label="Email Address (Optional)"
          type="email"
          placeholder="rajesh@example.com"
          {...register('email')}
          error={errors.email?.message}
        />

        <Input
          label="Address"
          placeholder="Shop / House Address, City"
          {...register('address')}
          error={errors.address?.message}
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Notes (Optional)
          </label>
          <textarea
            {...register('notes')}
            rows={2}
            placeholder="Customer preferences, credit terms, etc."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            {customerToEdit ? 'Save Changes' : 'Create Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
