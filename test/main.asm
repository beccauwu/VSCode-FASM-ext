format ELF64
;; ----------ABI-----------
;; for calls to c functions
;;    integer/pointer arguments 1–6 => rdi, rsi, rdx, rcx, r8, r9
;;    floating point arguments 1–8  => xmm0 – xmm7
;;    excess arguments              => stack
;;    int return                    => rax
;;    float return                  => xmm0
;;    for variadics, # of va_args   => al
;; https://en.wikipedia.org/wiki/X86_calling_conventions#System_V_AMD64_ABI
;;
;; for system calls
;;    syscall# => rax
;;    args     => rdi, rsi, rdx, r10, r8, r9 
;; ------------------------

;; build with `fasm main.asm && ld -I/lib64/ld-linux-x86-64.so.2 -o main main.o -lc`

section '.text' executable
extrn printf
extrn exit
; entrypoint
public _start
_start:
  ;; int3
  lea rdi, [msg]
  call printf
  xor rdi, rdi
  call exit
  
section '.data' writeable
msg db 'Hello world!',0xA,0