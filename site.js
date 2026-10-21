    document.getElementById('year').textContent=new Date().getFullYear();
    const copyEmailButton=document.querySelector('.copy-email');
    copyEmailButton.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(copyEmailButton.dataset.email);copyEmailButton.textContent='COPIED';setTimeout(()=>copyEmailButton.textContent='COPY EMAIL',1600)}catch{window.location.href='mailto:'+copyEmailButton.dataset.email}});
    if('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      document.querySelectorAll('section .section-head, .cap, .job, .credential, .end-inner').forEach(el=>el.setAttribute('data-reveal',''));
      const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target)}}),{threshold:.12,rootMargin:'0px 0px -35px 0px'});
      document.querySelectorAll('[data-reveal]').forEach(el=>revealObserver.observe(el));
    }
