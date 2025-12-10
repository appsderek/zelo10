import { Member, WeekSchedule, DutyAssignment, CleaningAssignment, ChairmanReaderAssignment, FieldServiceMeeting } from '../types';

// Declaração global para o html2canvas injetado no index.html
declare const html2canvas: any;

/**
 * Utilitário para gerar links de WhatsApp para notificações.
 */

const formatPhone = (phone: string): string => {
  // Remove tudo que não for número
  const nums = phone.replace(/\D/g, '');
  // Adiciona código do país se não tiver (Assumindo Brasil 55)
  if (nums.length <= 11 && !nums.startsWith('55')) {
    return `55${nums}`;
  }
  return nums;
};

export const getMemberByExactName = (name: string, members: Member[]): Member | undefined => {
  if (!name) return undefined;
  return members.find(m => m.fullName.trim().toLowerCase() === name.trim().toLowerCase());
};

export const createAssignmentMessage = (
  memberName: string, 
  date: string, 
  partName: string, 
  isReminder: boolean = false
): string => {
  const dateObj = new Date(date);
  // Ajuste de fuso horário simples para garantir a data correta na string (evita voltar 1 dia)
  const userTimezoneOffset = dateObj.getTimezoneOffset() * 60000;
  const adjustedDate = new Date(dateObj.getTime() + userTimezoneOffset);
  
  const formattedDate = adjustedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', weekday: 'long' });
  
  if (isReminder) {
    return `Olá *${memberName}*!%0A%0A🔔 *Lembrete Amigável:*%0AVocê tem uma designação programada para *${formattedDate}*:%0A👉 *${partName}*.%0A%0ABom preparo!`;
  }

  return `Olá *${memberName}*!%0A%0AVocê recebeu uma nova designação: *${partName}*.%0A📅 Data: *${formattedDate}*.%0A%0APor favor, confirme o recebimento.`;
};

export const openWhatsAppNotification = (
  member: Member | undefined, 
  message: string
) => {
  if (!member || !member.phone) {
    alert(`Telefone do publicador ${member?.fullName || ''} não cadastrado. Verifique o cadastro em 'Publicadores'.`);
    return;
  }

  const cleanPhone = formatPhone(member.phone);
  const url = `https://wa.me/${cleanPhone}?text=${message}`;
  window.open(url, '_blank');
};

export interface NotificationItem {
  id: string;
  member: Member;
  date: string;
  type: string; // 'Vida e Ministério', 'Limpeza', etc.
  description: string;
}

/**
 * Gera um ID único e determinístico para a notificação.
 * Se a data, o membro e a descrição forem os mesmos, o ID será o mesmo.
 */
const generateNotificationId = (date: string, memberId: string, description: string): string => {
  // Cria uma string única e converte para Base64 para usar como ID
  const uniqueString = `${date}|${memberId}|${description.trim()}`;
  return btoa(unescape(encodeURIComponent(uniqueString)));
};

/**
 * Varre todos os cronogramas em busca de designações dentro de um intervalo de dias (ex: Hoje até +2 dias)
 */
export const getPendingNotifications = (
  daysAhead: number, // 0 = só hoje, 1 = hoje e amanhã, 2 = hoje, amanhã e depois
  members: Member[],
  schedules: WeekSchedule[],
  duties: DutyAssignment[],
  cleaning: CleaningAssignment[],
  chairmanReaders: ChairmanReaderAssignment[],
  fieldService: FieldServiceMeeting[]
): NotificationItem[] => {
  const notifications: NotificationItem[] = [];
  const today = new Date();
  
  const daysMap = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  // Itera de Hoje (i=0) até o limite (i=daysAhead)
  for (let i = 0; i <= daysAhead; i++) {
     const loopDate = new Date();
     loopDate.setDate(today.getDate() + i);
     
     // Construção manual da string YYYY-MM-DD usando horário local
     const year = loopDate.getFullYear();
     const month = String(loopDate.getMonth() + 1).padStart(2, '0');
     const day = String(loopDate.getDate()).padStart(2, '0');
     const dateStr = `${year}-${month}-${day}`;
     
     const dayOfWeekName = daysMap[loopDate.getDay()];

     const addNotif = (name: string, type: string, description: string) => {
        if (!name || name === 'Outro/Convidado' || name === '') return;
        
        const member = getMemberByExactName(name, members);
        if (member) {
          notifications.push({
            id: generateNotificationId(dateStr, member.id, description), // ID DETERMINÍSTICO
            member,
            date: dateStr,
            type,
            description
          });
        }
     };

     // 1. Vida e Ministério
     const schedule = schedules.find(s => s.date === dateStr);
     if (schedule) {
        addNotif(schedule.chairman, 'Vida e Ministério', 'Presidente da Reunião');
        addNotif(schedule.auxClassCounselor, 'Vida e Ministério', 'Conselheiro Sala B');
        addNotif(schedule.openingPrayer, 'Vida e Ministério', 'Oração Inicial');
        addNotif(schedule.closingPrayer, 'Vida e Ministério', 'Oração Final');
        if(schedule.congregationStudy) {
            addNotif(schedule.congregationStudy.conductor, 'Vida e Ministério', 'Dirigente do Estudo');
            addNotif(schedule.congregationStudy.reader, 'Vida e Ministério', 'Leitor do Estudo');
        }
        
        schedule.treasuresParts?.forEach(p => {
          addNotif(p.assignedTo, 'Vida e Ministério', p.theme);
          if (p.isBHall) addNotif(p.assignedToB || '', 'Vida e Ministério', `${p.theme} (Sala B)`);
        });
        
        schedule.ministryParts?.forEach(p => {
          addNotif(p.assignedTo, 'Vida e Ministério', `Estudante: ${p.theme}`);
          addNotif(p.assistant, 'Vida e Ministério', `Ajudante: ${p.theme}`);
          if (p.isBHall) {
               addNotif(p.assignedToB || '', 'Vida e Ministério', `Estudante (Sala B): ${p.theme}`);
               addNotif(p.assistantB || '', 'Vida e Ministério', `Ajudante (Sala B): ${p.theme}`);
          }
        });

        schedule.livingParts?.forEach(p => {
           addNotif(p.assignedTo, 'Vida e Ministério', p.theme);
        });
     }

     // 2. Presidentes e Leitores
     const cr = chairmanReaders.find(c => c.date === dateStr);
     if (cr) {
        addNotif(cr.chairman, 'Fim de Semana', 'Presidente da Reunião');
        addNotif(cr.reader, 'Fim de Semana', 'Leitor de A Sentinela');
     }

     // 3. Designações de Apoio
     const duty = duties.find(d => d.date === dateStr);
     if (duty) {
        duty.attendants.split(',').map(s => s.trim()).forEach(name => addNotif(name, 'Apoio', 'Indicador'));
        duty.microphones.split(',').map(s => s.trim()).forEach(name => addNotif(name, 'Apoio', 'Microfone Volante'));
        duty.soundVideo.split(',').map(s => s.trim()).forEach(name => addNotif(name, 'Apoio', 'Operador de Áudio/Vídeo'));
     }

     // 4. Limpeza
     const cl = cleaning.find(c => c.date === dateStr);
     if (cl) {
        const groupMembers = members.filter(m => m.serviceGroup === cl.groupId);
        groupMembers.forEach(m => {
            notifications.push({
              id: generateNotificationId(dateStr, m.id, `Limpeza do Salão (Grupo ${cl.groupId})`),
              member: m,
              date: dateStr,
              type: 'Limpeza',
              description: `Limpeza do Salão (Grupo ${cl.groupId})`
            });
        });
     }

     // 5. Saídas de Campo (Recorrente)
     const meetingsToday = fieldService.filter(fs => fs.dayOfWeek === dayOfWeekName);
     meetingsToday.forEach(fs => {
         // O ID aqui combina data + nome + local para garantir unicidade diária
         addNotif(fs.conductor, 'Saída de Campo', `Dirigente (${fs.time} - ${fs.meetingPlace})`);
     });
  }

  // Ordenar por data (mais urgente primeiro) e depois por nome
  return notifications.sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.member.fullName.localeCompare(b.member.fullName);
  });
};

/**
 * Função de impressão baseada em Imagem (Screenshot).
 */
export const handlePrint = async () => {
  const element = document.querySelector('.printable-content') as HTMLElement;
  if (!element) {
    alert('Área de impressão não encontrada.');
    return;
  }

  if (typeof html2canvas === 'undefined') {
    alert('A biblioteca de impressão ainda está carregando. Aguarde...');
    return;
  }

  try {
    const activeBtn = document.activeElement as HTMLElement;
    const originalText = activeBtn ? activeBtn.innerText : '';
    if (activeBtn) {
        activeBtn.innerText = 'Gerando...';
        activeBtn.style.opacity = '0.7';
        activeBtn.style.cursor = 'wait';
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      ignoreElements: (el: HTMLElement) => el.classList.contains('print-hidden'),
      onclone: (clonedDoc: Document) => {
        const inputs = clonedDoc.querySelectorAll('input, textarea, select');
        inputs.forEach((input: any) => {
           if (input.type === 'checkbox' || input.type === 'radio') {
             if (input.checked) input.setAttribute('checked', '');
           } else {
             input.setAttribute('value', input.value); 
           }
        });
      }
    });

    if (activeBtn) {
        activeBtn.innerText = originalText;
        activeBtn.style.opacity = '1';
        activeBtn.style.cursor = 'pointer';
    }

    const imgData = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita popups para imprimir.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir Documento</title>
          <style>
            body { margin: 0; padding: 20px; display: flex; justify-content: center; background: #f0f0f0; }
            img { max-width: 100%; height: auto; box-shadow: 0 4px 10px rgba(0,0,0,0.1); background: white; }
            @media print { body { padding: 0; background: white; display: block; } img { box-shadow: none; width: 100%; } }
          </style>
        </head>
        <body>
          <img src="${imgData}" />
          <script>
            window.onload = function() { setTimeout(function() { window.print(); }, 500); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();

  } catch (error) {
    console.error('Erro ao gerar impressão:', error);
    alert('Ocorreu um erro ao gerar a imagem para impressão.');
    const activeBtn = document.activeElement as HTMLElement;
    if (activeBtn) {
        activeBtn.style.opacity = '1';
        activeBtn.style.cursor = 'pointer';
    }
  }
};