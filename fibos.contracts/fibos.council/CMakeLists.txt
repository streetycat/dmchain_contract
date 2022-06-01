add_executable(fibos.council.wasm ${CMAKE_CURRENT_SOURCE_DIR}/src/fibos.council.cpp)
target_include_directories(fibos.council.wasm
   PUBLIC 
   ${CMAKE_CURRENT_SOURCE_DIR}/include)

set_target_properties(fibos.council.wasm
   PROPERTIES
   RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/bin/fibos.council")

configure_file("${CMAKE_CURRENT_SOURCE_DIR}/abi/fibos.council.abi" "${CMAKE_CURRENT_SOURCE_DIR}/bin/fibos.council" COPYONLY)

