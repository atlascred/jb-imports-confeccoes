import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'JB Imports Confecções | Dry Fit no Atacado',description:'Camisetas, bermudas e conjuntos dry fit. Conheça a coleção de moda esportiva JB Imports Confecções.',icons:{icon:'/logo.webp'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
