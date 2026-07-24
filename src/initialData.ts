import { CMSState } from './types';

export const INITIAL_CMS_DATA: CMSState = {
  info: {
    name: "Dra. Júlia Guaraldo",
    specialty: "Médica Veterinária | Atendimento Domiciliar & Anestesiologia",
    phone: "(11) 99999-8888",
    whatsapp: "5511999998888",
    instagram: "dra.juliaguaraldo",
    email: "contato@juliaguaraldovet.com.br",
    address: "Atendimento domiciliar em São Paulo, ABC Paulista e Região",
    googleMapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117036.03572224727!2d-46.73229712061205!3d-23.550519941914144!2m3!1f0!2f0!3f0!3m2!1i1024!2i1024!2f768!2f49.4!3m3!1m2!1s0x94ce5822b30a5c4d%3A0x2a3e83b4b5744!2zU8OjbyBQYXVsbywgU1A!5e0!3m2!1spt-BR!2sbr!4v1626788888888!5m2!1spt-BR!2sbr",
    
    heroTitle: "Cuidado e carinho no conforto do lar para quem você mais ama",
    heroSubtitle: "Atendimento veterinário domiciliar personalizado e anestesiologia segura, unindo dedicação humana e alta competência científica.",
    heroButtonText1: "Agendar Consulta",
    heroButtonText2: "Falar no WhatsApp",
    heroBgImage: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=1600",
    
    aboutTitle: "Sobre Mim",
    aboutText: "Olá! Sou a Dra. Júlia Guaraldo, médica veterinária apaixonada por proporcionar bem-estar, saúde e conforto aos animais. Entendo que nossos pets são membros valiosos da nossa família e merecem um atendimento repleto de paciência, respeito e carinho.\n\nMinha missão é levar medicina veterinária de alta qualidade até a sua casa, eliminando o estresse do transporte e proporcionando uma experiência de cuidado leve, tanto para o animal quanto para você, tutor.\n\nAlém do atendimento preventivo e clínico domiciliar, possuo especialização em anestesiologia veterinária, área crucial para garantir a segurança, a ausência de dor e o retorno tranquilo do seu companheiro em qualquer procedimento cirúrgico.",
    aboutImage: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800",
    
    specializations: [
      "Anestesiologia Veterinária e Controle de Dor",
      "Clínica Médica e Atendimento Geral de Cães e Gatos",
      "Medicina Felina e Manejo Amigável (Cat-Friendly)",
      "Cuidados Paliativos e Geriatria Canina e Felina",
      "Bloqueios Locorregionais Transoperatórios"
    ],
    experiences: [
      "Anestesiologista Veterinária em hospitais veterinários parceiros desde 2021",
      "Atendimento Clínico Veterinário Domiciliar autônomo com mais de 500 famílias atendidas",
      "Consultora técnica em controle de dor crônica e cuidados especiais em domicílio"
    ],
    formations: [
      "Graduada em Medicina Veterinária",
      "Especialização em Anestesiologia Veterinária Avançada",
      "Curso Avançado de Manejo e Comportamento Felino",
      "Membro da Associação Brasileira de Anestesiologia Veterinária"
    ]
  },
  services: [
    {
      id: "1",
      title: "Atendimento Veterinário Domiciliar",
      description: "Consultas, exames de sangue e vacinação ética no conforto e segurança do lar do seu pet.",
      details: "O atendimento veterinário em domicílio oferece toda a atenção personalizada que seu pet precisa, livre da ansiedade provocada pela caixinha de transporte e salas de espera. É a escolha ideal para gatos, animais idosos, com dificuldade de locomoção ou reativos. Realizamos aplicação de medicamentos, coleta de exames laboratoriais, check-up preventivo completo e vacinação ética importada, com todo o tempo do mundo reservado especialmente para vocês.",
      icon: "Home",
      image: "https://images.unsplash.com/photo-1581888227599-779811939961?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: "2",
      title: "Anestesiologia Veterinária",
      description: "Planejamento e execução de protocolos anestésicos modernos e seguros para procedimentos cirúrgicos.",
      details: "A anestesia é desenhada sob medida para as características individuais de cada pet, minimizando os riscos através do uso combinado de técnicas modernas (anestesia inalatória, venosa total e bloqueios de nervos locais). A monitoração é ininterrupta do início ao fim, cuidando do ritmo cardíaco, pressão arterial, oxigenação, temperatura e profundidade do plano anestésico para que a cirurgia ocorra com segurança absoluta.",
      icon: "Activity",
      image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: "3",
      title: "Avaliação Pré-operatória",
      description: "Exames detalhados de risco anestésico e análise laboratorial minuciosa antes da cirurgia.",
      details: "Antes de qualquer anestesia ou procedimento cirúrgico, realizamos um exame clínico rigoroso de triagem, além de avaliar os exames complementares de sangue e cardíacos do paciente. Essa etapa é indispensável para identificar fatores de risco individuais, calibrar os medicamentos adequados e garantir que o pet esteja na melhor condição possível para entrar no centro cirúrgico.",
      icon: "ShieldAlert",
      image: "https://images.unsplash.com/photo-1596499717302-cd483850b7e2?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: "4",
      title: "Acompanhamento Pós-operatório",
      description: "Gerenciamento eficaz da dor e monitoramento da cicatrização na recuperação pós-cirúrgica.",
      details: "Oferecemos suporte analgésico de excelência na fase crítica da recuperação do pet após a cirurgia. O controle eficiente de dor crônica ou aguda acelera a cicatrização, previne complicações inflamatórias e propicia um retorno à alimentação e atividade normais com o máximo de conforto doméstico.",
      icon: "HeartPulse",
      image: "https://images.unsplash.com/photo-1535268647977-a403b69fc756?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: "5",
      title: "Consultoria e Suporte Continuado",
      description: "Diretrizes de cuidados paliativos, manejo ambiental de animais idosos e suporte a tutores.",
      details: "Para animais portadores de doenças de curso prolongado ou senis que requerem cuidados especializados diários, elaboramos uma consultoria dedicada ao bem-estar contínuo. Isso inclui orientações de conforto no lar, enriquecimento ambiental focado em gatos ou cães limitados e protocolos medicamentosos focados em reabilitação de dor articular crônica.",
      icon: "Sparkles",
      image: "https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?auto=format&fit=crop&q=80&w=800"
    }
  ],
  media: [
    {
      id: "m1",
      type: "photo",
      url: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&q=80&w=800",
      caption: "Exame clínico de um gatinho no conforto do sofá do tutor, sem estresse",
      category: "Atendimentos"
    },
    {
      id: "m2",
      type: "photo",
      url: "https://images.unsplash.com/photo-1579684389782-64d84b5e902a?auto=format&fit=crop&q=80&w=800",
      caption: "Monitoramento de parâmetros fisiológicos cruciais durante procedimento anestésico",
      category: "Procedimentos"
    },
    {
      id: "m3",
      type: "photo",
      url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=800",
      caption: "Sessão de carinho e verificação de saúde com paciente feliz",
      category: "Atendimentos"
    },
    {
      id: "m4",
      type: "photo",
      url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800",
      caption: "Recuperação cirúrgica segura e monitoramento pós-operatório acolhedor",
      category: "Antes e Depois"
    },
    {
      id: "m5",
      type: "video",
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      caption: "Vídeo educativo: Como funciona a anestesiologia veterinária moderna",
      category: "Procedimentos",
      videoType: "youtube"
    }
  ],
  testimonials: [
    {
      id: "t1",
      name: "Mariana Silva",
      content: "A Dra. Júlia foi um anjo na vida do meu gatinho Oliver. Ele morria de pavor de sair de casa e, graças ao atendimento domiciliar, fez todos os exames de sangue brincando e ronronando. Recomendo de olhos fechados!",
      petName: "Oliver",
      petSpecies: "Gato",
      rating: 5,
      date: "2026-07-10",
      approved: true
    },
    {
      id: "t2",
      name: "Roberto Gomes",
      content: "Meu cachorro precisou passar por uma cirurgia complexa de retirada de nódulo e eu estava morrendo de medo da anestesia por ele já ser velhinho. A Dra. Júlia fez toda a avaliação antes e nos transmitiu uma segurança gigante. A anestesia foi perfeita!",
      petName: "Thor",
      petSpecies: "Cão",
      rating: 5,
      date: "2026-07-15",
      approved: true
    },
    {
      id: "t3",
      name: "Beatriz Nogueira",
      content: "Profissional extremamente competente, pontual e carinhosa. Explicou cada detalhe da medicação para controle de dor do meu pet idoso. A qualidade de vida dele melhorou muito depois das orientações.",
      petName: "Mel",
      petSpecies: "Cão",
      rating: 5,
      date: "2026-07-18",
      approved: true
    }
  ],
  blog: [
    {
      id: "b1",
      title: "Por que o atendimento veterinário em casa é ideal para os gatos?",
      summary: "Os felinos são animais extremamente sensíveis a mudanças no ambiente. Entenda por que a consulta domiciliar é a melhor escolha para eles.",
      content: "Gatos são territorialistas por natureza e qualquer saída de seu ambiente seguro pode desencadear picos severos de estresse e ansiedade. O transporte na caixinha, os barulhos da rua e o odor de outros animais na clínica tradicional podem elevar o cortisol do felino, dificultando inclusive a avaliação de parâmetros vitais como pressão arterial e frequência cardíaca.\n\nQuando a Dra. Júlia Guaraldo vai até a sua casa, o gato permanece em seu próprio território. A consulta é realizada de forma gentil, no tempo do animal, utilizando técnicas de manejo 'cat-friendly'. Isso garante exames mais fidedignos e uma experiência muito mais positiva para o seu amigo felino.",
      category: "Manejo Felino",
      image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800",
      date: "2026-07-15",
      tags: ["Gatos", "Atendimento Domiciliar", "Cat-Friendly"],
      views: 142
    },
    {
      id: "b2",
      title: "Anestesia Inalatória em Pets: Mitos e Verdades",
      summary: "Muitos tutores sentem medo quando ouvem a palavra 'anestesia'. Descubra como as técnicas modernas tornam os procedimentos altamente seguros.",
      content: "O medo da anestesia é um dos sentimentos mais comuns entre tutores de animais que precisam passar por cirurgias. No entanto, com a evolução da anestesiologia veterinária, os riscos foram reduzidos a níveis extremamente baixos.\n\nA anestesia inalatória é uma técnica excelente, mas hoje em dia ela é quase sempre combinada com anestesia venosa total (TIVA) e anestesia locorregionais (bloqueios). Isso constitui a chamada 'anestesia multimodal'. Ao usar várias classes de medicamentos em doses menores, conseguimos uma estabilidade cardiovascular fantástica, controle perfeito da dor transcirúrgica e um retorno anestésico extremamente suave, rápido e indolor.",
      category: "Anestesiologia",
      image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800",
      date: "2026-07-18",
      tags: ["Anestesia", "Segurança", "Cirurgia"],
      views: 98
    }
  ],
  appointments: [
    {
      id: "a1",
      name: "Clarice Antunes",
      phone: "(11) 98765-4321",
      whatsapp: "5511987654321",
      email: "clarice@gmail.com",
      species: "Gato",
      breed: "Persa",
      age: "3 anos",
      weight: "4.2 kg",
      reason: "Consulta geral preventiva e aplicação de vacina tríplice anual.",
      date: "2026-07-22",
      time: "14:00",
      address: "Rua das Amoreiras, 120 - Apto 54",
      cep: "01234-010",
      observations: "Oliver é um gato dócil mas um pouco assustado.",
      status: "Pendente",
      createdAt: "2026-07-19T10:30:00Z"
    },
    {
      id: "a2",
      name: "Marcus Aurelius",
      phone: "(11) 97777-6666",
      whatsapp: "5511977776666",
      email: "marcus.a@uol.com.br",
      species: "Cão",
      breed: "Golden Retriever",
      age: "8 anos",
      weight: "36 kg",
      reason: "Avaliação de risco anestésico e consulta para cirurgia de remoção de tártaro.",
      date: "2026-07-24",
      time: "09:30",
      address: "Av. Paulista, 1500",
      cep: "01311-200",
      observations: "Precisa de avaliação pois tem um leve sopro cardíaco.",
      status: "Confirmado",
      createdAt: "2026-07-20T11:15:00Z"
    }
  ],
  financialItems: [
    {
      id: "fi1",
      name: "Consulta Clínica Domiciliar",
      category: "Serviço",
      type: "service",
      price: 250,
      description: "Exame clínico geral presencial e anamnese no domicílio do tutor.",
      unit: "Sessão",
      code: "SERV-001"
    },
    {
      id: "fi2",
      name: "Avaliação Anestésica Pré-Operatória",
      category: "Procedimento",
      type: "service",
      price: 350,
      description: "Avaliação de risco anestésico, ausculta e planejamento multimodal.",
      unit: "Procedimento",
      code: "SERV-002"
    },
    {
      id: "fi3",
      name: "Protocolo Anestésico Cirúrgico (Hora)",
      category: "Procedimento",
      type: "service",
      price: 600,
      description: "Monitoramento ininterrupto de parâmetros com anestesia inalatória/venosa.",
      unit: "Hora",
      code: "SERV-003"
    },
    {
      id: "fi4",
      name: "Vacina V10 / Tríplice Felina Domiciliar",
      category: "Serviço",
      type: "service",
      price: 160,
      description: "Aplicação e emissão de carteirinha de vacinação ética.",
      unit: "Dose",
      code: "SERV-004"
    },
    {
      id: "fi5",
      name: "Meloxicam Gatos/Cães 0.5mg / mL",
      category: "Medicamento",
      type: "medication",
      price: 65,
      description: "Anti-inflamatório não esteroidal veterinário.",
      dosage: "0.1 mg/kg",
      stock: 15,
      unit: "Frasco",
      code: "MED-001"
    },
    {
      id: "fi6",
      name: "Dipirona Sódica Injetável 500mg/mL",
      category: "Medicamento",
      type: "medication",
      price: 30,
      description: "Analgésico e antitérmico para aplicação veterinária.",
      dosage: "25 mg/kg",
      stock: 30,
      unit: "Ampola",
      code: "MED-002"
    },
    {
      id: "fi7",
      name: "Kit Bloqueio Locorregional Anestésico",
      category: "Insumo",
      type: "medication",
      price: 180,
      description: "Cateteres, agulhas de neurolocalização e anestésico local.",
      stock: 10,
      unit: "Kit",
      code: "INS-001"
    }
  ],
  financialBudgets: [
    {
      id: "fb1",
      appointmentId: "a2",
      clientName: "Marcus Aurelius",
      petName: "Thor (Golden Retriever)",
      date: "2026-07-24",
      items: [
        {
          itemId: "fi2",
          name: "Avaliação Anestésica Pré-Operatória",
          type: "service",
          unitPrice: 350,
          quantity: 1,
          total: 350
        },
        {
          itemId: "fi6",
          name: "Dipirona Sódica Injetável 500mg/mL",
          type: "medication",
          unitPrice: 30,
          quantity: 1,
          total: 30
        }
      ],
      discount: 20,
      subtotal: 380,
      total: 360,
      status: "Pago",
      paymentMethod: "Pix",
      notes: "Avaliação realizada com sucesso antes do procedimento de tártaro.",
      createdAt: "2026-07-24T10:00:00Z"
    }
  ],
  stats: {
    accesses: 1240,
    views: 3120
  }
};
