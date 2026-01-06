format ELF64

struc dtr_t limit,base ; structure for both gdtr & idtr
{
  .limit dw limit ; length
  .base dq base   ; address
}

struc interrupt_frame n
{
  .n dq n ;
  .rax dq ;
  .rbx dq ;
  .rcx dq ;
  .
}

section '.text' executable align 16

extrn exception_handler
extrn interrupt_dispatch
public set_idtr ; (uint16_t limit, uint64_t base): dtr_t *
public get_gdtr ; (void): dtr_t *
set_idtr:
  mov [idtr.limit], di
  mov [idtr.base], rsi
  lidt [idtr]
  lea rax, [idtr]
  ret
get_gdtr:
  sgdt [gdtr]
  lea rax, [gdtr]
  ret
isr_stub:
  push rax
  push rbx
  push rcx
  push rdx
  push rsi
  push rdi
  push rbp
  rept 8 n:8
  {
  push r#n
  }
  mov rdi, rsp
  call exception_handler
  rept 8 n:8
  {
  reverse pop r#n
  }
  pop rbp
  pop rdi
  pop rsi
  pop rdx
  pop rcx
  pop rbx
  pop rax
  add rsp, 16
  iret
irq_stub:
  push rax
  push rbx
  push rcx
  push rdx
  push rsi
  push rdi
  push rbp
  rept 8 n:8
  {
  push r#n
  }
  mov rdi, rsp
  call interrupt_dispatch
  rept 8 n:8
  {
  reverse pop r#n
  }
  pop rbp
  pop rdi
  pop rsi
  pop rdx
  pop rcx
  pop rbx
  pop rax
  add rsp, 16
  iret

macro isr n
{
public isr_#n
align 16
isr_#n:
  if n in <8,10,11,12,13,14,17>
  push QWORD n
  else
  push QWORD 0
  push QWORD n
  end if
  jmp isr_stub
}
rept 32 n:0 
{
isr n
}

macro irq n
{
public irq_#n
align 16
irq_#n:
  push 0
  push n + 32
  jmp irq_stub
}

rept 224 n:0 
{
irq n
}

section '.data' writeable

public isr_stub_table
public irq_stub_table
isr_stub_table:
rept 32 n:0 
{
dq isr_#n
}
irq_stub_table:
rept 224 n:0 
{
dq irq_#n
}
idtr dtr_t 0, 0
gdtr dtr_t 0, 0