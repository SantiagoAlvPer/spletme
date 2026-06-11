/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';
import LocalStorageService from '../services/localstorage';

interface UseCurrentCollaboratorProps {
  collaborators: any[];
}

const useCurrentCollaborator = ({ collaborators }: UseCurrentCollaboratorProps) => {
  const currentCollaborator = useMemo(() => {
    if (!collaborators || collaborators.length === 0) {
      return null;
    }

    // Obtener el usuario actual del localStorage
    const currentUser = LocalStorageService.getItem("user");
    const currentUserId = currentUser?.id;
    const currentUserEmail = currentUser?.email;

    if (!currentUserId && !currentUserEmail) {
      return null;
    }

    // Buscar el colaborador que coincida con el usuario actual
    const collaborator = collaborators.find(collab => 
      collab._id === currentUserId || 
      collab.id === currentUserId ||
      collab.email === currentUserEmail
    );

    if (!collaborator) {
      return null;
    }

    // Porcentaje del split (modelo SongSplit) y monto adeudado en vivo.
    const percentage = collaborator.split?.percentage || 0;
    const amountToPay = collaborator.amountOwed || 0;

    return {
      ...collaborator,
      percentage: percentage.toFixed(2),
      amountToPay: amountToPay.toFixed(2),
      calculatedAmount: amountToPay,
      status: collaborator.hasActiveSplit ? 'active' : 'unknown'
    };
  }, [collaborators]);

  // Funciones de utilidad
  const getCurrentUserPercentage = () => {
    return currentCollaborator ? currentCollaborator.percentage : '0.00';
  };

  const getCurrentUserAmount = () => {
    return currentCollaborator ? currentCollaborator.amountToPay : '0.00';
  };

  const getCurrentUserStatus = () => {
    return currentCollaborator ? currentCollaborator.status : 'unknown';
  };

  const isCurrentUserCollaborator = () => {
    return currentCollaborator !== null;
  };

  return {
    currentCollaborator,
    getCurrentUserPercentage,
    getCurrentUserAmount,
    getCurrentUserStatus,
    isCurrentUserCollaborator
  };
};

export default useCurrentCollaborator;