import { generateDesign } from './generateDesign';
import { getFigmaData } from './getFIgmaLayout';

type Event = 'HTML' | 'GENERATE';

export default async function index(event: Event, message: string) {
  switch (event) {
    case 'HTML':
      await getFigmaData(message);
      break;
    case 'GENERATE':
      await generateDesign(message);
      break;
    default:
      throw new Error(`Hey, check your request ${event}`);
  }
}

index(
  'GENERATE',
  'AIチャットの画面を作って。サイドバーに過去のチャット履歴が見れる。'
);
