-- ============================================================
-- WEST 1 Sales Lab — Dados iniciais (personas e cenários)
-- ============================================================
-- Execute após a migration inicial para popular com presets.
-- NOTA: Para inserir com created_by, substitua NULL pelo UUID do usuário master.

insert into public.student_profiles
  (name, age, gender, destination, marital_status, personality, profession, ai_voice_tone, created_by)
values
  (
    'João Oliveira', 22, 'Male', 'Sydney', 'Single',
    'Impulsivo, direto, fala rápido, sem paciência.',
    'Estudante de engenharia mecânica',
    'Jovem, firme, impaciente, fala cortando o interlocutor.',
    null
  ),
  (
    'Ana Costa', 28, 'Female', 'Dublin', 'Single',
    'Ansiosa, muitas perguntas, precisa de segurança e reassurance.',
    'Designer gráfica',
    'Voz preocupada, perguntas rápidas, tom hesitante.',
    null
  ),
  (
    'Ricardo Lima', 35, 'Male', 'Toronto', 'Married',
    'Cético, exige dados e comprovações, não acredita facilmente.',
    'Engenheiro de software',
    'Tom firme, seco, cético, pausa antes de responder.',
    null
  ),
  (
    'Mariana Santos', 24, 'Female', 'Londres', 'Single',
    'Entusiasmada, muito animada, quer tudo pra ontem.',
    'Estudante de Administração',
    'Animada, fala rápido, empolgada, usa gírias jovens.',
    null
  );

insert into public.scenarios
  (name, description, west1_expectation, created_by)
values
  (
    'Dúvida dos Pais',
    'O estudante quer ir, mas os pais têm medo. Eles são quem paga e questionam a segurança, o processo do visto e a confiabilidade da agência. Costumam querer "provas" de credibilidade: tempo de mercado, parcerias oficiais e atendimento presencial. Geralmente pedem orçamentos detalhados e preferem contato via e-mail para revisar tudo. Alguns citam "histórias ruins" de conhecidos e querem garantias de acompanhamento no exterior.',
    'O consultor deve adotar um tom tranquilo, educativo e protetor. Antes de explicar, busque entender as preocupações reais: "O que mais deixa seus pais inseguros?" / "Eles já tiveram contato com alguma agência?" / "Quer que eu mande um e-mail pra eles com tudo detalhado?" Durante o atendimento: conte brevemente a história da WEST 1 (18 anos de mercado, milhares de estudantes embarcados); mostre provas sociais (Google Reviews, depoimentos, vídeos de estudantes); destaque que a WEST 1 tem escritório local na Austrália e atendimento 24h; explique que o suporte é contínuo: pré-embarque, pós-chegada e durante o curso. Finalize se colocando à disposição dos pais — envie um e-mail oficial e proponha uma ligação ou reunião online. Imprescindível perguntar: quem é o responsável financeiro; quais são os principais medos dos pais (visto, segurança, golpe); eles já pesquisaram outras agências.',
    null
  ),
  (
    'Objeção de Preço',
    'O estudante demonstra interesse, mas acha o programa caro. Compara com agências concorrentes mais baratas e questiona o que justifica a diferença de valor. Fica resistente quando o consultor fala de benefícios sem apresentar diferenciais claros.',
    'O consultor não deve entrar em guerra de preços. Deve primeiro entender o que o estudante pesquisou e qual concorrente citou. Depois, mostrar a diferença de valor: suporte local no destino, parceria direta com escolas, estrutura da equipe WEST 1, acompanhamento do visto e seguro. O foco é transformar "por que pagar mais" em "o que estou recebendo a mais". Finalizar com uma proposta personalizada e timeline de pagamento.',
    null
  ),
  (
    'Indecisão de Destino',
    'O estudante não sabe para onde quer ir. Está entre 2 ou 3 destinos e fica oscilando. Quer ser convencido, mas tem medo de errar. Pede muito a opinião do consultor.',
    'O consultor deve fazer perguntas investigativas antes de sugerir qualquer destino: "O que você mais quer desenvolver lá fora?" / "Você prefere uma cidade grande ou menor?" / "Tem alguma restrição de clima ou custo de vida?" Com base nas respostas, montar um comparativo prático e indicar 1 ou 2 opções com argumentos claros. Não forçar uma decisão, mas criar um senso de urgência baseado em vagas e calendário escolar.',
    null
  ),
  (
    'Retorno Rápido ao Assunto Principal',
    'O estudante começa a conversa com interesse, mas fica fugindo do assunto — fala de outros planos de vida, de dúvidas genéricas, de histórias de amigos — e o consultor precisa trazer o foco de volta para o intercâmbio sem parecer impaciente ou rude.',
    'O consultor deve usar técnicas de ancoragem: "Entendo! E como você vê isso se conectando com seu objetivo de intercâmbio?" / "Interessante! Isso me lembra uma situação de uma estudante nossa que foi pra Dublin — posso te contar?" A arte é guiar a conversa sem cortar o estudante. Finalizar sempre voltando para os próximos passos concretos: simulação financeira, escolha de escola, calendário.',
    null
  );
