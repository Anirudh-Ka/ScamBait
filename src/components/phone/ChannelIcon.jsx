import { MessageSquare, Mail, AtSign, Phone, Voicemail } from 'lucide-react';

export const CHANNEL_LABEL = { sms: 'Text message', email: 'Email', dm: 'Direct message', call: 'Phone call' };

export default function ChannelIcon({ channel, voicemail, size = 18 }) {
  const Icon = channel === 'email' ? Mail : channel === 'dm' ? AtSign : channel === 'call' ? (voicemail ? Voicemail : Phone) : MessageSquare;
  return <Icon size={size} aria-hidden="true" />;
}
