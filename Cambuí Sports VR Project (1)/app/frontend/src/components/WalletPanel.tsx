import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge as BaseBadge } from '@/components/ui/badge';
import { Button as BaseButton } from '@/components/ui/button';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Coins,
  CreditCard,
  Image,
} from 'lucide-react';

const Button = BaseButton as any;
const Badge = BaseBadge as any;

export function WalletPanel() {
  const walletData = {
    balanceBRL: 15750.0,
    tokenBalance: 45000,
    nftsOwned: 12,
    transactions: [
      { id: 1, type: 'credit', description: 'Assinatura Premium - Julho', amount: 49.90, date: '2026-07-12' },
      { id: 2, type: 'credit', description: 'Pay-per-view: Bahia x Vitória', amount: 29.90, date: '2026-07-12' },
      { id: 3, type: 'debit', description: 'Compra Fan Token - Bahia', amount: -500.0, date: '2026-07-11' },
      { id: 4, type: 'credit', description: 'Venda NFT Ingresso #0042', amount: 150.0, date: '2026-07-10' },
      { id: 5, type: 'credit', description: 'Assinatura Premium - Junho', amount: 49.90, date: '2026-06-12' },
    ],
    nfts: [
      { id: 1, name: 'Ingresso VR - Bahia x Vitória', type: 'ticket', rarity: 'common' },
      { id: 2, name: 'Camisa Digital Bahia 2026', type: 'collectible', rarity: 'rare' },
      { id: 3, name: 'Troféu Campeonato Baiano', type: 'trophy', rarity: 'legendary' },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/20 glow-green">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wallet size={16} className="text-primary" />
              <span className="text-xs text-muted-foreground font-medium">Saldo Fiat (BRL)</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              R$ {walletData.balanceBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex gap-2 mt-4">
              <Button size="sm" className="text-xs cursor-pointer">
                <CreditCard size={12} className="mr-1" /> PIX
              </Button>
              <Button size="sm" variant="outline" className="text-xs cursor-pointer">
                <ArrowUpRight size={12} className="mr-1" /> Transferir
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Coins size={16} className="text-orange-400" />
              <span className="text-xs text-muted-foreground font-medium">Token Cambuí</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {walletData.tokenBalance.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">≈ R$ 4.500,00</p>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="text-xs cursor-pointer">
                Comprar
              </Button>
              <Button size="sm" variant="outline" className="text-xs cursor-pointer">
                Vender
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Image size={16} className="text-purple-400" />
              <span className="text-xs text-muted-foreground font-medium">NFTs</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{walletData.nftsOwned}</p>
            <p className="text-xs text-muted-foreground mt-1">colecionáveis</p>
            <Button size="sm" variant="outline" className="text-xs mt-4 cursor-pointer">
              Ver Coleção
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Blockchain Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Blockchain Cambuí</CardTitle>
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
              <Shield size={10} className="mr-1" /> Operacional
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Nós Validadores</p>
              <p className="text-lg font-bold text-foreground">5/5</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Algoritmo</p>
              <p className="text-lg font-bold text-foreground">PoA</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Último Bloco</p>
              <p className="text-lg font-bold text-foreground">#1.247.832</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Transações/s</p>
              <p className="text-lg font-bold text-foreground">1.200</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NFT Collection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Coleção NFT</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {walletData.nfts.map((nft) => (
              <div key={nft.id} className="p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {nft.type === 'ticket' ? 'Ingresso' : nft.type === 'collectible' ? 'Colecionável' : 'Troféu'}
                  </Badge>
                  <Badge className={`text-[10px] ${
                    nft.rarity === 'legendary' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                    nft.rarity === 'rare' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    'bg-gray-500/10 text-gray-400 border-gray-500/20'
                  }`}>
                    {nft.rarity === 'legendary' ? 'Lendário' : nft.rarity === 'rare' ? 'Raro' : 'Comum'}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-foreground mt-2">{nft.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Últimas Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {walletData.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  tx.type === 'credit' ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}>
                  {tx.type === 'credit' ? (
                    <ArrowDownLeft size={14} className="text-green-500" />
                  ) : (
                    <ArrowUpRight size={14} className="text-red-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <p className={`text-sm font-semibold ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.amount >= 0 ? '+' : ''}R$ {Math.abs(tx.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}