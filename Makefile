all: web/js/QosSimulator.pde
	
web/js/QosSimulator.pde:
	cat $(wildcard processing/*.pde) > web/js/QosSimulator.pde
	
clean:
	rm web/js/QosSimulator.pde